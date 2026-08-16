package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// TunnelSpec defines the desired state of a Cloudflare Tunnel and the cloudflared
// deployment that runs it.
type TunnelSpec struct {
	// Name is the tunnel name shown in the Cloudflare dashboard. Defaults to the resource name.
	// +optional
	Name string `json:"name,omitempty"`

	// Image is the cloudflared image run by the tunnel pods.
	// +kubebuilder:default="cloudflare/cloudflared:2026.7.3"
	// +optional
	Image string `json:"image,omitempty"`

	// Replicas is the number of cloudflared pod replicas.
	// +kubebuilder:default=2
	// +optional
	Replicas int32 `json:"replicas,omitempty"`

	// Routes lists private network CIDRs, e.g. "10.42.0.0/16", to route through this tunnel.
	// +optional
	Routes []string `json:"routes,omitempty"`

	// Ingress lists public hostname routing rules for this tunnel, evaluated in order. If the
	// last rule has a Hostname, the controller appends a catch-all rule after it, since
	// Cloudflare requires the ingress list to end with one.
	// +optional
	Ingress []IngressRule `json:"ingress,omitempty"`

	// PodDisruptionBudget, if set, creates a PodDisruptionBudget for the tunnel's cloudflared
	// pods.
	// +optional
	PodDisruptionBudget *PodDisruptionBudgetSpec `json:"podDisruptionBudget,omitempty"`
}

// PodDisruptionBudgetSpec configures the PodDisruptionBudget for a Tunnel's cloudflared pods.
type PodDisruptionBudgetSpec struct {
	// MinAvailable is the minimum number of cloudflared pods that must remain available during
	// a voluntary disruption.
	// +kubebuilder:default=1
	// +optional
	MinAvailable int32 `json:"minAvailable,omitempty"`
}

// IngressRule maps a public hostname to the local service cloudflared proxies matching
// requests to.
type IngressRule struct {
	// Hostname is the public hostname to match, e.g. "app.kbntx.com" or "*.kbntx.com". Omit
	// only on a trailing catch-all rule.
	// +optional
	Hostname string `json:"hostname,omitempty"`

	// Service is the address cloudflared proxies matching requests to, e.g.
	// "https://traefik-ingress.traefik-ingress.svc.cluster.local", or "http_status:404" for a
	// catch-all rule that returns 404.
	Service string `json:"service"`

	// OriginRequest customizes how cloudflared connects to Service.
	// +optional
	OriginRequest *OriginRequestConfig `json:"originRequest,omitempty"`
}

// OriginRequestConfig customizes how cloudflared connects to an ingress rule's Service.
type OriginRequestConfig struct {
	// MatchSNIToHost makes cloudflared send the same hostname as the request's Host header for
	// the TLS SNI when connecting to Service, instead of Service's own hostname.
	// +optional
	MatchSNIToHost bool `json:"matchSNItoHost,omitempty"`
}

// TunnelStatus reflects the observed state of a Cloudflare Tunnel.
type TunnelStatus struct {
	// TunnelID is the Cloudflare-assigned ID of the tunnel.
	// +optional
	TunnelID string `json:"tunnelID,omitempty"`

	// Ready is true once the tunnel, its routes, and its cloudflared deployment are reconciled.
	// +optional
	Ready bool `json:"ready,omitempty"`

	// Message describes the last reconciliation result, useful when Ready is false.
	// +optional
	Message string `json:"message,omitempty"`

	// ObservedGeneration is the generation last reconciled by the controller.
	// +optional
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Tunnel ID",type=string,JSONPath=`.status.tunnelID`
// +kubebuilder:printcolumn:name="Ready",type=boolean,JSONPath=`.status.ready`

// Tunnel is a namespaced Cloudflare Tunnel, backed by a cloudflared Deployment this
// controller creates and keeps in sync.
type Tunnel struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TunnelSpec   `json:"spec"`
	Status TunnelStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// TunnelList contains a list of Tunnel.
type TunnelList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Tunnel `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Tunnel{}, &TunnelList{})
}
