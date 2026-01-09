{{- define "db.name" -}}
db
{{- end }}

{{- define "db.fullname" -}}
{{ .Release.Name }}-db
{{- end }}
