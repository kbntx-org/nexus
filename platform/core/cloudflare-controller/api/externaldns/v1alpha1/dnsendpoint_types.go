package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// Hand-copied subset of external-dns's own DNSEndpoint CRD (sigs.k8s.io/external-dns), to
// avoid a compile-time dependency on its full module for four small structs.
type DNSEndpoint struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec DNSEndpointSpec `json:"spec,omitempty"`
}

type DNSEndpointList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []DNSEndpoint `json:"items"`
}

type DNSEndpointSpec struct {
	Endpoints []Endpoint `json:"endpoints,omitempty"`
}

type Endpoint struct {
	DNSName          string           `json:"dnsName,omitempty"`
	Targets          []string         `json:"targets,omitempty"`
	RecordType       string           `json:"recordType,omitempty"`
	RecordTTL        int64            `json:"recordTTL,omitempty"`
	ProviderSpecific ProviderSpecific `json:"providerSpecific,omitempty"`
}

type ProviderSpecificProperty struct {
	Name  string `json:"name,omitempty"`
	Value string `json:"value,omitempty"`
}
type ProviderSpecific []ProviderSpecificProperty

func (in *DNSEndpoint) DeepCopyInto(out *DNSEndpoint) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

func (in *DNSEndpoint) DeepCopy() *DNSEndpoint {
	if in == nil {
		return nil
	}
	out := new(DNSEndpoint)
	in.DeepCopyInto(out)
	return out
}

func (in *DNSEndpoint) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *DNSEndpointList) DeepCopyInto(out *DNSEndpointList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		out.Items = make([]DNSEndpoint, len(in.Items))
		for i := range in.Items {
			in.Items[i].DeepCopyInto(&out.Items[i])
		}
	}
}

func (in *DNSEndpointList) DeepCopy() *DNSEndpointList {
	if in == nil {
		return nil
	}
	out := new(DNSEndpointList)
	in.DeepCopyInto(out)
	return out
}

func (in *DNSEndpointList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *DNSEndpointSpec) DeepCopyInto(out *DNSEndpointSpec) {
	*out = *in
	if in.Endpoints != nil {
		out.Endpoints = make([]Endpoint, len(in.Endpoints))
		for i := range in.Endpoints {
			in.Endpoints[i].DeepCopyInto(&out.Endpoints[i])
		}
	}
}

func (in *Endpoint) DeepCopyInto(out *Endpoint) {
	*out = *in
	if in.Targets != nil {
		out.Targets = make([]string, len(in.Targets))
		copy(out.Targets, in.Targets)
	}
}
