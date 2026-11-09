# Conectar el endpoint de respuestas

Cuando el endpoint exista, el único archivo que hay que cambiar es `src/services/answerService.ts`. La pantalla no cambia: llama a `requestAnswer(prompt, signal)` y muestra `response.content`.

## Qué recibe el endpoint

`prompt` es el texto del campo, ya sin espacios al inicio ni al final. `signal` no se envía al servidor; solo sirve para cancelar la petición si el usuario pulsa Clear conversation.

```json
{
  "prompt": "texto que escribió el usuario"
}
```

## Qué debe responder

La interfaz solo lee `content`.

```json
{
  "content": "texto de la respuesta"
}
```

## Qué reemplazar

Sustituye el cuerpo de `requestAnswer` por la llamada real. Después puedes borrar `mockAnswerResponse`, `resolveMockContent`, `delay` y `MOCK_LATENCY_MS`.

```ts
export async function requestAnswer(
  prompt: string,
  signal?: AbortSignal,
): Promise<AnswerResponse> {
  const response = await fetch('https://example.com/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })

  if (!response.ok) {
    throw new Error('The answer could not be loaded.')
  }

  return response.json() as Promise<AnswerResponse>
}
```

Si el endpoint usa otro nombre de campo, cámbialo solo dentro de `JSON.stringify`. La respuesta debe seguir teniendo `content`.
