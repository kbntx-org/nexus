package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// AccessApplicationSpec defines the desired state of a Cloudflare Access application.
type AccessApplicationSpec struct {
	// Name is the application name shown in the Cloudflare dashboard. Defaults to the resource name.
	// +optional
	Name string `json:"name,omitempty"`

	// Domain is the public hostname protected by this application, e.g. "app.example.com".
	Domain string `json:"domain"`

	// SessionDuration controls how long a successful Access authorization lasts.
	// +kubebuilder:default="24h"
	// +optional
	SessionDuration string `json:"sessionDuration,omitempty"`

	// PolicyRefs lists the names of AccessPolicy resources, in this same namespace, to attach
	// to the application. Order matters: policies are evaluated in the order listed here.
	// +kubebuilder:validation:MinItems=1
	PolicyRefs []string `json:"policyRefs"`
}

// AccessApplicationStatus reflects the observed state of a Cloudflare Access application.
type AccessApplicationStatus struct {
	// ApplicationID is the Cloudflare-assigned ID of the Access application.
	// +optional
	ApplicationID string `json:"applicationID,omitempty"`

	// Ready is true once the application, and all referenced policies, have been reconciled.
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
// +kubebuilder:printcolumn:name="Domain",type=string,JSONPath=`.spec.domain`
// +kubebuilder:printcolumn:name="Application ID",type=string,JSONPath=`.status.applicationID`
// +kubebuilder:printcolumn:name="Ready",type=boolean,JSONPath=`.status.ready`

// AccessApplication is a namespaced Cloudflare Zero Trust Access application.
type AccessApplication struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AccessApplicationSpec   `json:"spec"`
	Status AccessApplicationStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// AccessApplicationList contains a list of AccessApplication.
type AccessApplicationList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AccessApplication `json:"items"`
}

func init() {
	SchemeBuilder.Register(&AccessApplication{}, &AccessApplicationList{})
}
