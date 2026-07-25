"use client";

import * as React from "react";

import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};

type NativeOptionLikeProps = React.ComponentProps<"option">;
type NativeOptGroupLikeProps = React.ComponentProps<"optgroup">;

function toLabel(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(toLabel).join("");
  }

  return "";
}

function parseOption(option: React.ReactElement<NativeOptionLikeProps>): CustomSelectOption | null {
  if (option.props.value === undefined || option.props.value === null) {
    return null;
  }

  const value = String(option.props.value);
  return {
    value,
    label: toLabel(option.props.children) || value,
    disabled: Boolean(option.props.disabled),
  };
}

function parseChildrenToOptions(children: React.ReactNode): CustomSelectOption[] {
  const options: CustomSelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === NativeSelectOptGroup || child.type === "optgroup") {
      const group = child as React.ReactElement<NativeOptGroupLikeProps>;

      React.Children.forEach(group.props.children, (groupChild) => {
        if (!React.isValidElement(groupChild)) {
          return;
        }

        if (groupChild.type === NativeSelectOption || groupChild.type === "option") {
          const parsed = parseOption(groupChild as React.ReactElement<NativeOptionLikeProps>);
          if (parsed) {
            options.push(parsed);
          }
        }
      });
      return;
    }

    if (child.type === NativeSelectOption || child.type === "option") {
      const parsed = parseOption(child as React.ReactElement<NativeOptionLikeProps>);
      if (parsed) {
        options.push(parsed);
      }
    }
  });

  return options;
}

function NativeSelect({
  className,
  size = "default",
  value,
  defaultValue,
  onChange,
  children,
  disabled,
  id,
  ...props
}: NativeSelectProps) {
  const options = React.useMemo(() => parseChildrenToOptions(children), [children]);

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!onChange) {
        return;
      }

      const syntheticEvent = {
        target: { value: nextValue },
      } as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    },
    [onChange],
  );

  return (
    <div
      className={cn("group/native-select relative w-fit", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <CustomSelect
        id={id}
        ariaLabel={typeof props["aria-label"] === "string" ? props["aria-label"] : undefined}
        value={typeof value === "string" ? value : undefined}
        defaultValue={typeof defaultValue === "string" ? defaultValue : undefined}
        onValueChange={handleValueChange}
        options={options}
        disabled={disabled}
        triggerClassName={cn(
          "border-input dark:bg-input/30 dark:hover:bg-input/50",
          size === "sm" ? "h-8" : "h-9",
        )}
      />
    </div>
  );
}

function NativeSelectOption({}: React.ComponentProps<"option">) {
  return null;
}

function NativeSelectOptGroup({}: NativeOptGroupLikeProps) {
  return null;
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
