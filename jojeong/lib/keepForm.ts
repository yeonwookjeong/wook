import { startTransition, type FormEvent } from "react";

// React resets a <form action={…}> once its action finishes, which wipes every field when the server answers
// with an error. Submitting through the handler instead keeps what was typed; redirects still work.
export const keepValues = (dispatch: (data: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  startTransition(() => dispatch(data));
};
