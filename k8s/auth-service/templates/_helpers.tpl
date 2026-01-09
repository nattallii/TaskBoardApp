{{- define "auth.name" -}}
auth
{{- end }}

{{- define "auth.fullname" -}}
{{ .Release.Name }}-auth
{{- end }}
