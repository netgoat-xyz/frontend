import { useCallback, useState } from "react";

/**
 * Enhanced form state management for settings
 * Optimized for multiple fields and validation
 */
export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<keyof T, string | undefined>;
  onSubmit?: (values: T) => Promise<void>;
}

export function useOptimizedForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
) {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | undefined>>({} as any);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Optimized field change handler - only updates specific field
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;
      const fieldValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [fieldName]: fieldValue,
      }));

      setIsDirty(true);

      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: undefined,
        }));
      }
    },
    [errors]
  );

  // Optimized blur handler
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      const fieldName = name as keyof T;

      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      // Validate single field on blur
      if (options.validate) {
        const fieldErrors = options.validate(values);
        if (fieldErrors[fieldName]) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: fieldErrors[fieldName],
          }));
        }
      }
    },
    [options, values]
  );

  // Optimized form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate all fields
      const allErrors: Record<keyof T, string | undefined> = {} as any;
      if (options.validate) {
        Object.assign(allErrors, options.validate(values));
      }

      setErrors(allErrors);

      // Check if there are any errors
      if (Object.values(allErrors).some((error) => error)) {
        return;
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        },
        {} as Record<keyof T, boolean>
      );
      setTouched(allTouched);

      if (options.onSubmit) {
        setIsSubmitting(true);
        try {
          await options.onSubmit(values);
          setIsDirty(false);
        } catch (error) {
          console.error("Form submission error:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [options, values]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(options.initialValues);
    setErrors({} as any);
    setTouched({} as any);
    setIsDirty(false);
  }, [options.initialValues]);

  // Set specific field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  };
}
