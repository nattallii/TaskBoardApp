{{- define "profile.name" -}}
profile
{{- end }}

{{- define "profile.fullname" -}}
{{ .Release.Name }}-{{ include "profile.name" . }}
{{- end }}
