package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// AccessRuleSet selects who an include/exclude/require rule matches. Multiple fields
// set on the same rule set are OR'd together into separate Cloudflare selectors.
type AccessRuleSet struct {
	// Everyone matches any authenticated or unauthenticated user.
	// +optional
	Everyone bool `json:"everyone,omitempty"`

	// Emails lists individual email addresses to match.
	// +optional
	Emails []string `json:"emails,omitempty"`

	// EmailDomains lists email domains (e.g. "example.com") to match.
	// +optional
	EmailDomains []string `json:"emailDomains,omitempty"`

	// IPRanges lists CIDR ranges to match.
	// +optional
	IPRanges []string `json:"ipRanges,omitempty"`
}

// AccessPolicySpec defines the desired state of a Cloudflare Access reusable policy.
type AccessPolicySpec struct {
	// Name is the policy name shown in the Cloudflare dashboard. Defaults to the resource name.
	// +optional
	Name string `json:"name,omitempty"`

	// Decision is the action Cloudflare takes when this policy matches a request.
	// +kubebuilder:validation:Enum=allow;deny;non_identity;bypass
	Decision string `json:"decision"`

	// Include rules are OR'd together; at least one must match for the policy to apply.
	// +kubebuilder:validation:MinItems=1
	Include []AccessRuleSet `json:"include"`

	// Exclude rules override a matching Include rule.
	// +optional
	Exclude []AccessRuleSet `json:"exclude,omitempty"`

	// Require rules must all match in addition to Include.
	// +optional
	Require []AccessRuleSet `json:"require,omitempty"`
}

// AccessPolicyStatus reflects the observed state of a Cloudflare Access reusable policy.
type AccessPolicyStatus struct {
	// PolicyID is the Cloudflare-assigned ID of the reusable Access policy.
	// +optional
	PolicyID string `json:"policyID,omitempty"`

	// Ready is true once the policy has been reconciled with Cloudflare.
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
// +kubebuilder:printcolumn:name="Policy ID",type=string,JSONPath=`.status.policyID`
// +kubebuilder:printcolumn:name="Ready",type=boolean,JSONPath=`.status.ready`

// AccessPolicy is a namespaced, reusable Cloudflare Zero Trust Access policy.
type AccessPolicy struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AccessPolicySpec   `json:"spec"`
	Status AccessPolicyStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// AccessPolicyList contains a list of AccessPolicy.
type AccessPolicyList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AccessPolicy `json:"items"`
}

func init() {
	SchemeBuilder.Register(&AccessPolicy{}, &AccessPolicyList{})
}
