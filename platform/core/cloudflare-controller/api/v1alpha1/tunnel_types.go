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
