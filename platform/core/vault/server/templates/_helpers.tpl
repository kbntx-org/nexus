{{- define "vault.seedContainer" -}}
- name: vault-seed
  image: {{ .Values.image }}
  restartPolicy: Always
  env:
    - name: VAULT_ADDR
      value: "http://127.0.0.1:8200"
    - name: VAULT_TOKEN
      value: "root"
  command:
    - /bin/sh
    - -c
    - /scripts/seed-vault.sh
  volumeMounts:
    - name: vault-seed-script
      mountPath: /scripts/seed-vault.sh
      subPath: seed-vault.sh
{{- end }}

{{- define "vault.configInitContainer" -}}
- name: config-init
  image: kbntx/nexus-ci-toolkit:1.0
  command: ["/bin/sh", "-c"]
  args:
    - envsubst < /vault/config-template/config.hcl > /vault/config/config.hcl
  env:
    - name: VAULT_POSTGRES_CONNECTION_URI
      valueFrom:
        secretKeyRef:
          name: vault-secret
          key: databaseUri
  volumeMounts:
    - name: vault-config-map
      mountPath: /vault/config-template/config.hcl
      subPath: config.hcl
    - name: vault-config
      mountPath: /vault/config
{{- end }}
