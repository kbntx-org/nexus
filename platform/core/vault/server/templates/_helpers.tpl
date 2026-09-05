{{- define "vault.seedContainer" -}}
- name: vault-seed
  image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
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
