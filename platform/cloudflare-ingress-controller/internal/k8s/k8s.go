package k8s

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
)

const legacyIngressClassAnnotation = "kubernetes.io/ingress.class"
const watchReconnectDelay = 5 * time.Second

// Service lists and watches Kubernetes Ingress resources.
type Service interface {
	List(ctx context.Context) ([]string, error)
	Watch(ctx context.Context, onChange func()) error
}

type service struct {
	client           kubernetes.Interface
	ingressClassName string
}

// NewService constructs a Service backed by the given Kubernetes client.
// If ingressClassName is empty, all Ingress resources are matched.
func NewService(client kubernetes.Interface, ingressClassName string) Service {
	return &service{client: client, ingressClassName: ingressClassName}
}

// List returns deduplicated hostnames from all matching Ingress resources.
func (s *service) List(ctx context.Context) ([]string, error) {
	list, err := s.client.NetworkingV1().Ingresses("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list ingresses: %w", err)
	}

	seen := map[string]bool{}
	var hostnames []string
	for _, ingress := range list.Items {
		if !s.matchesClass(&ingress) {
			continue
		}
		for _, rule := range ingress.Spec.Rules {
			if rule.Host != "" && !seen[rule.Host] {
				seen[rule.Host] = true
				hostnames = append(hostnames, rule.Host)
			}
		}
	}
	return hostnames, nil
}

// Watch calls onChange on any Ingress add/modify/delete event. It reconnects
// automatically on errors and only returns when ctx is cancelled.
func (s *service) Watch(ctx context.Context, onChange func()) error {
	for {
		if err := s.runWatch(ctx, onChange); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			slog.Warn("ingress watch error, reconnecting", "delay", watchReconnectDelay, "error", err)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(watchReconnectDelay):
		}
	}
}

func (s *service) runWatch(ctx context.Context, onChange func()) error {
	watcher, err := s.client.NetworkingV1().Ingresses("").Watch(ctx, metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("start watch: %w", err)
	}
	defer watcher.Stop()

	slog.Info("watching ingress resources")
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event, ok := <-watcher.ResultChan():
			if !ok {
				return nil // channel closed — reconnect
			}
			switch event.Type {
			case watch.Added, watch.Modified, watch.Deleted:
				ingress, ok := event.Object.(*networkingv1.Ingress)
				if ok && s.matchesClass(ingress) {
					onChange()
				}
			case watch.Error:
				return fmt.Errorf("watch error event")
			}
		}
	}
}

func (s *service) matchesClass(ingress *networkingv1.Ingress) bool {
	if s.ingressClassName == "" {
		return true
	}
	if ingress.Spec.IngressClassName != nil && *ingress.Spec.IngressClassName == s.ingressClassName {
		return true
	}
	return ingress.Annotations[legacyIngressClassAnnotation] == s.ingressClassName
}
