# Classmix

[![npm](https://img.shields.io/npm/v/@vowdemon/classmix)](https://www.npmjs.com/package/@vowdemon/classmix)
[![npm](https://img.shields.io/npm/dm/@vowdemon/classmix)](https://www.npmjs.com/package/@vowdemon/classmix)
[![GitHub](https://img.shields.io/github/license/vowdemon/classmix)](https://github.com/vowdemon/classmix)

A utility for managing CSS class names with variants and conditions.

## Core Features

- **Variant System** - Define and combine toggleable style options
- **Slots** - Apply styles to different parts of your components
- **Conditional Styling** - Apply classes based on complex conditions
- **Shared Styles** - Share style rules across multiple slots
- **Component Inheritance** - Extend existing components
- **High Performance** - Optimized for frequent re-renders

## Installation

```bash
npm install @vowdemon/classmix
```

## Basic Usage

### Creating an Instance

```javascript
import { createClassmix } from "classmix";

// Basic usage
const cx = createClassmix();

// With a wrapper function (like tailwind-merge)
import { twMerge } from "tailwind-merge";
const cx = createClassmix(twMerge);
```

### Defining Component Styles

```javascript
const button = cx({
  // Base class
  base: "btn",

  // Slot classes
  slots: {
    icon: "btn-icon",
    text: "btn-text",
  },

  // Variants
  variants: {
    color: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
      danger: "bg-red-500 text-white",
    },
    size: {
      sm: "text-sm py-1 px-2",
      md: "text-base py-2 px-4",
      lg: "text-lg py-3 px-6",
    },
    rounded: {
      true: "rounded-full",
      false: "rounded",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "",
    },
  },

  // Compound variants
  compounds: [
    // Simple condition
    {
      color: "primary",
      size: "lg",
      class: "font-bold",
    },

    // Slot-specific styling
    {
      color: "primary",
      class: {
        icon: "text-blue-200",
      },
    },

    // Function condition
    {
      $when: (ctx) => ctx.disabled && ctx.color === "primary",
      class: "bg-blue-300",
    },

    // Shared styles
    {
      disabled: true,
      $share: {
        slots: ["icon", "text"],
        class: "opacity-70",
      },
    },

    // Dynamic class generation
    {
      $when: (ctx) => ctx.$isActive,
      class: (ctx) => `active-${ctx.color}`,
    },
  ],

  // Default variants
  defaultVariants: {
    color: "primary",
    size: "md",
    rounded: false,
    disabled: false,
  },
});
```

### Using Component Styles

```javascript
// With default variants
const defaultButton = button();
console.log(defaultButton()); // Get base element classes
console.log(defaultButton.icon()); // Get icon slot classes
console.log(defaultButton.text()); // Get text slot classes

// With specific variants
const largeButton = button({ size: "lg", color: "secondary" });
console.log(largeButton());

// With boolean variants
const roundedButton = button({ rounded: true });
console.log(roundedButton());

// With context data
const activeButton = button({ $isActive: true, color: "danger" });
console.log(activeButton());

// With slot-level class
console.log(button().icon({ class: "extra-icon-class" }));

// With slot-level variant override
console.log(button().icon({ disabled: true }));
```

### Component Inheritance

```javascript
// Base button
const baseButton = cx({
  base: "btn",
  variants: {
    color: {
      primary: "bg-blue-500",
      secondary: "bg-gray-500",
    },
  },
});

// Extended button
const outlinedButton = cx({
  extends: baseButton,
  variants: {
    outlined: {
      true: "bg-transparent border-2",
      false: "",
    },
  },
  compounds: [
    {
      color: "primary",
      outlined: true,
      class: "border-blue-500 text-blue-500",
    },
  ],
});
```

## Examples

### Card Component

```javascript
const card = cx({
  base: "rounded overflow-hidden",
  slots: {
    header: "p-4 border-b",
    body: "p-4",
    footer: "p-4 border-t",
  },
  variants: {
    theme: {
      light: {
        base: "bg-white border-gray-200",
        header: "bg-gray-50",
        footer: "bg-gray-50",
      },
      dark: {
        base: "bg-gray-800 border-gray-700",
        header: "bg-gray-900",
        footer: "bg-gray-900",
      },
    },
  },
  defaultVariants: {
    theme: "light",
  },
});

// Usage
const darkCard = card({ theme: "dark" });
console.log(darkCard.header());
```

### Form Input

```javascript
const input = cx({
  base: "block w-full rounded",
  slots: {
    label: "block text-sm font-medium mb-1",
    input: "px-3 py-2 border",
    error: "mt-1 text-sm",
  },
  compounds: [
    {
      $when: (ctx) => Boolean(ctx.error),
      class: { input: "border-red-500" },
      $share: {
        slots: ["label", "error"],
        class: "text-red-500",
      },
    },
  ],
});

// Usage
const errorInput = input({ error: "This field is required" });
console.log(errorInput.label());
console.log(errorInput.input());
console.log(errorInput.error());
```

## Benchmark

Comparison between Classmix and tailwind-variants using the same test scenarios:

- Class Composition Performance Comparison (20 slots, 20 variants, 20 compound variants)

| Test Scenario                  | tv (ops/sec)      | cx (ops/sec)   | Winner | Performance Advantage |
| ------------------------------ | ----------------- | -------------- | ------ | --------------------- |
| **Initialization**             | 1,243,029 ±2.18%  | 164,315 ±2.09% | tv     | +656.49%              |
| **Inheritance Initialization** | 10,834,846 ±3.14% | 124,748 ±1.94% | tv     | +8585.38%             |
| **First Render**               | 4,321 ±1.92%      | 117,482 ±2.47% | cx     | +96.32%               |
| **Repeated Render**            | 4,327 ±1.86%      | 126,054 ±2.40% | cx     | +96.57%               |
| **Props Change**               | 4,286 ±2.13%      | 110,917 ±2.23% | cx     | +96.14%               |
| **Component Lifecycle**        | 891 ±1.88%        | 22,628 ±2.07%  | cx     | +96.06%               |
| **Compound Slots Render**      | 2,110 ±2.15%      | 56,978 ±2.36%  | cx     | +96.30%               |

> **Test Environment**:  
> CPU: Intel Core i5-13400F  
> Runtime: Node 24.0.1  
> Units: ops/sec (higher is better)  
> Stability: ±% shows standard deviation across runs.

## LICENSE

MIT
