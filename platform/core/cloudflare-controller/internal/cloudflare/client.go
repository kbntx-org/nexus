package cloudflare

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const baseURL = "https://api.cloudflare.com/client/v4"

type Client struct {
	httpClient *http.Client
	apiToken   string
	accountID  string
}

func NewClient(apiToken, accountID string) *Client {
	return &Client{httpClient: http.DefaultClient, apiToken: apiToken, accountID: accountID}
}

// Rule is a single Cloudflare Access selector, e.g. {"email": {"email": "a@b.com"}}.
type Rule map[string]any

type PolicyPayload struct {
	Name     string `json:"name"`
	Decision string `json:"decision"`
	Include  []Rule `json:"include"`
	Exclude  []Rule `json:"exclude,omitempty"`
	Require  []Rule `json:"require,omitempty"`
}

type ApplicationPayload struct {
	Name            string   `json:"name"`
	Domain          string   `json:"domain"`
	Type            string   `json:"type"`
	SessionDuration string   `json:"session_duration"`
	Policies        []string `json:"policies"`
}

type apiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e apiError) String() string {
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (c *Client) do(ctx context.Context, method, path string, body, out any) error {
	var reqBody io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode request body: %w", err)
		}
		reqBody = bytes.NewReader(encoded)
	}

	request, err := http.NewRequestWithContext(ctx, method, baseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	request.Header.Set("Authorization", "Bearer "+c.apiToken)
	request.Header.Set("Content-Type", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return fmt.Errorf("read response body: %w", err)
	}

	var envelope struct {
		Success bool            `json:"success"`
		Errors  []apiError      `json:"errors"`
		Result  json.RawMessage `json:"result"`
	}
	if err := json.Unmarshal(responseBody, &envelope); err != nil {
		return fmt.Errorf("decode response envelope (status %d): %w", response.StatusCode, err)
	}
	if !envelope.Success {
		return fmt.Errorf("cloudflare API error (status %d): %v", response.StatusCode, envelope.Errors)
	}

	if out != nil {
		if err := json.Unmarshal(envelope.Result, out); err != nil {
			return fmt.Errorf("decode response result: %w", err)
		}
	}
	return nil
}

func (c *Client) CreatePolicy(ctx context.Context, payload PolicyPayload) (string, error) {
	var result struct {
		ID string `json:"id"`
	}
	path := fmt.Sprintf("/accounts/%s/access/policies", c.accountID)
	if err := c.do(ctx, http.MethodPost, path, payload, &result); err != nil {
		return "", err
	}
	return result.ID, nil
}

func (c *Client) UpdatePolicy(ctx context.Context, id string, payload PolicyPayload) error {
	path := fmt.Sprintf("/accounts/%s/access/policies/%s", c.accountID, id)
	return c.do(ctx, http.MethodPut, path, payload, nil)
}

func (c *Client) DeletePolicy(ctx context.Context, id string) error {
	path := fmt.Sprintf("/accounts/%s/access/policies/%s", c.accountID, id)
	return c.do(ctx, http.MethodDelete, path, nil, nil)
}

func (c *Client) CreateApplication(ctx context.Context, payload ApplicationPayload) (string, error) {
	var result struct {
		ID string `json:"id"`
	}
	path := fmt.Sprintf("/accounts/%s/access/apps", c.accountID)
	if err := c.do(ctx, http.MethodPost, path, payload, &result); err != nil {
		return "", err
	}
	return result.ID, nil
}

func (c *Client) UpdateApplication(ctx context.Context, id string, payload ApplicationPayload) error {
	path := fmt.Sprintf("/accounts/%s/access/apps/%s", c.accountID, id)
	return c.do(ctx, http.MethodPut, path, payload, nil)
}

func (c *Client) DeleteApplication(ctx context.Context, id string) error {
	path := fmt.Sprintf("/accounts/%s/access/apps/%s", c.accountID, id)
	return c.do(ctx, http.MethodDelete, path, nil, nil)
}
