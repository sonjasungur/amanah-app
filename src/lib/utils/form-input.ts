/**
 * What the field really holds. Text typed before the page has hydrated reaches the input but not the
 * React state, and slow phones get there: reading the state alone would send an empty value.
 * The fields keep having no name attribute, so that a submit before hydration sends nothing anywhere.
 */
export function typedValue(form: HTMLFormElement, selector: string): string {
  return form.querySelector<HTMLInputElement>(selector)?.value ?? "";
}
