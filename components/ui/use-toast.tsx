"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: ToasterToast[], action: Action): ToasterToast[] {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "DISMISS_TOAST":
      return state.map((t) =>
        t.id === action.toastId || action.toastId === undefined
          ? { ...t, open: false }
          : t
      );
    case "REMOVE_TOAST":
      if (!action.toastId) return [];
      return state.filter((t) => t.id !== action.toastId);
    default:
      return state;
  }
}

export function toast({
  title,
  description,
  ...props
}: Omit<ToasterToast, "id">) {
  const id = genId();
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      title,
      description,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      },
    },
  });
  setTimeout(
    () => dispatch({ type: "REMOVE_TOAST", toastId: id }),
    TOAST_REMOVE_DELAY
  );
  return id;
}

export function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { toasts: state, toast };
}

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
