{{- define "board.name" -}}
board
{{- end }}

{{- define "board.fullname" -}}
{{ .Release.Name }}-board
{{- end }}
