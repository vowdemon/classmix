import { describe, it, expect } from "vitest";
import { createClassmix } from "./main";
import cc from "classcat";

interface CustomMatchers<R = unknown> {
  toHaveClass: (classes: string[] | string) => R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

const cx = createClassmix();

expect.extend({
  toHaveClass(received: any, expected: string[] | string) {
    received = cc(received);
    if (typeof expected === "string") expected = expected.trim().split(/\s+/);

    const receivedClasses = received.trim().split(/\s+/);

    const missingClasses = expected.filter(
      (cls) => !receivedClasses.includes(cls)
    );
    const pass = missingClasses.length === 0;

    if (pass) {
      return {
        message: () =>
          `Expected classes: ${expected.join(", ")}\n` +
          `Not to be present in: "${received}"\n` +
          `But all classes were found`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected classes: ${expected.join(", ")}\n` +
          `To be present in: "${received}"\n` +
          `Missing classes: ${missingClasses.join(", ")}`,
        pass: false,
      };
    }
  },
});

describe("Basic Usage", () => {
  it("base and slots", () => {
    const def = cx({
      base: "base",
      slots: {
        icon: "icon",
      },
    });
    const ist = def();
    expect(ist()).toHaveClass(["base"]);
    expect(ist.base()).toHaveClass(["base"]);
    expect(ist.icon()).toHaveClass(["icon"]);
  });

  it("base and slots.base coexist", () => {
    const def = cx({
      base: "base",
      slots: { base: "base2" },
    });
    const ist = def();
    expect(ist()).toHaveClass(["base2"]);
    expect(ist.base()).toHaveClass(["base2"]);
  });

  it("variants", () => {
    const def = cx({
      variants: {
        size: { sm: "size-sm" },
        variant: { primary: "variant-primary" },
      },
    });
    const ist = def({ size: "sm", variant: "primary" });
    expect(ist()).toHaveClass(["size-sm", "variant-primary"]);
  });

  it("variants with slots", () => {
    const def1 = cx({
      variants: { size: { sm: "size-sm" } },
      slots: { icon: "icon" },
    });
    const def2 = cx({
      variants: { size: { sm: { base: "size-sm" } } },
      slots: { icon: "icon" },
      base: "",
    });

    const def3 = cx({
      variants: { size: { sm: { base: "size-sm", icon: "size-sm-icon" } } },
      slots: { icon: "icon" },
    });

    const ist1 = def1({ size: "sm" });
    expect(ist1()).toHaveClass(["size-sm"]);
    const ist2 = def2({ size: "sm" });
    expect(ist2()).toHaveClass(["size-sm"]);

    expect(ist1.icon()).not.toHaveClass(["size-sm"]);
    expect(ist2.icon()).not.toHaveClass(["size-sm"]);

    const ist3 = def3({ size: "sm" });
    expect(ist3()).not.toHaveClass(["size-sm-icon"]);
    expect(ist3()).toHaveClass(["size-sm"]);
    expect(ist3.icon()).toHaveClass(["size-sm-icon"]);
    expect(ist3.icon()).not.toHaveClass(["size-sm"]);
  });

  it("variants with defaultVariants", () => {
    const def = cx({
      variants: { size: { sm: "size-sm" } },
      defaultVariants: { size: "sm" },
    });
    const ist = def();
    expect(ist()).toHaveClass(["size-sm"]);
  });

  it("boolean variants", () => {
    const def = cx({
      variants: { active: { true: "active", false: "inactive" } },
    });
    const ist = def({ active: true });
    expect(ist()).toHaveClass(["active"]);
    const ist2 = def({ active: false });
    expect(ist2()).toHaveClass(["inactive"]);
  });

  it("boolean variants with false as default", () => {
    const def = cx({
      variants: { active: { true: "active", false: "inactive" } },
    });
    const ist = def();
    expect(ist()).toHaveClass(["inactive"]);
  });

  it("boolean variants can use string form", () => {
    const def = cx({
      variants: { active: { true: "active", false: "inactive" } },
    });
    const ist = def({ active: "true" });
    expect(ist()).toHaveClass(["active"]);
  });

  it("boolean variants override default", () => {
    const def = cx({
      variants: { active: { true: "active", false: "inactive" } },
      defaultVariants: { active: false },
    });
    const ist = def({ active: true });
    expect(ist()).toHaveClass(["active"]);
  });

  it("number variants", () => {
    const def = cx({
      variants: { size: { 10: "size-10" } },
    });
    const ist = def({ size: 10 });
    expect(ist()).toHaveClass(["size-10"]);
  });

  it("number variants can use string form", () => {
    const def = cx({
      variants: { size: { 10: "size-10" } },
    });
    const ist = def({ size: "10" });
    expect(ist()).toHaveClass(["size-10"]);
  });
});

describe("Static Compound Variants", () => {
  it("unconditional compound", () => {
    const def = cx({
      base: "base",
      compounds: [
        {
          class: "c1",
        },
      ],
    });
    const ist = def();
    expect(ist()).toHaveClass(["base", "c1"]);
  });

  it("conditional compound", () => {
    const def = cx({
      base: "base",
      variants: { size: { sm: "", lg: "" } },
      compounds: [{ size: "sm", class: "c1" }],
    });
    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "c1"]);
    expect(ist({ size: "lg" })).not.toHaveClass(["c1"]);
  });

  it("compound variants with slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: {} },
      compounds: [{ size: "sm", class: { base: "c1", icon: "c1-icon" } }],
    });

    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "c1"]);
    expect(ist.icon({ size: "sm" })).toHaveClass(["c1-icon"]);
    expect(ist({ size: "lg" })).not.toHaveClass(["c1-icon", "c1"]);
  });

  it("compound variant class slot defaults to base", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: {} },
      compounds: [{ size: "sm", class: "c1" }],
    });
    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "c1"]);
    expect(ist.icon({ size: "sm" })).not.toHaveClass(["base", "c1"]);
  });

  it("unconditional compound for all slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      compounds: [{ $share: { class: "c1" } }],
    });
    const ist = def();
    expect(ist()).toHaveClass(["base", "c1"]);
    expect(ist.icon()).toHaveClass(["c1"]);
  });

  it("conditional compound for all slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: { sm: "size-sm" } },
      compounds: [{ size: "sm", $share: { class: "c1" } }],
    });
    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "size-sm", "c1"]);
    expect(ist.icon({ size: "sm" })).toHaveClass(["icon", "c1"]);
    expect(ist.icon({ size: "lg" })).not.toHaveClass(["c1"]);
  });

  it("unconditional compound for specified slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      compounds: [{ $share: { slots: ["base"], class: "c1" } }],
    });
    const ist = def();
    expect(ist()).toHaveClass(["base", "c1"]);
    expect(ist.icon()).not.toHaveClass(["c1"]);
  });

  it("conditional compound for specified slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: { sm: "size-sm" } },
      compounds: [{ size: "sm", $share: { slots: ["base"], class: "c1" } }],
    });
    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "size-sm", "c1"]);
    expect(ist.icon({ size: "sm" })).not.toHaveClass(["c1"]);
  });

  it("compound empty slots", () => {
    const def = cx({
      base: "base",
      slots: {},
      compounds: [{ $share: { slots: [], class: "c1" } }],
    });
    const ist = def();
    expect(ist()).not.toHaveClass(["c1"]);
  });
});

describe("Dynamic Compound Variants - Dynamic Conditions", () => {
  it("unconditional accept", () => {
    const def = cx({
      base: "base",
      compounds: [{ $when: () => true, class: "c1" }],
    });
    const ist = def();
    expect(ist()).toHaveClass(["base", "c1"]);
  });

  it("unconditional reject", () => {
    const def = cx({
      base: "base",
      compounds: [{ $when: () => false, class: "c1" }],
    });
    const ist = def();
    expect(ist()).not.toHaveClass(["c1"]);
  });

  it("accept by variants", () => {
    const def = cx({
      base: "base",
      variants: { size: { sm: "size-sm" } },
      compounds: [
        {
          $when: (context, slots) => {
            if (context.size === "sm") {
              return true;
            }
            return false;
          },
          class: "c1",
        },
      ],
    });
    const ist = def();
    expect(ist({ size: "sm" })).toHaveClass(["base", "size-sm", "c1"]);
    expect(ist({ size: "lg" })).not.toHaveClass(["c1"]);
  });

  it("accept with $context", () => {
    const def = cx({
      base: "base",
      compounds: [{ $when: (context) => context.$size === "sm", class: "c1" }],
    });
    const ist = def({ $size: "sm" });
    expect(ist()).toHaveClass(["base", "c1"]);
  });

  it("accept with slot", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon", other: "" },
      compounds: [
        {
          $when: (_, slot) => {
            return slot === "icon" || slot === "base";
          },
          $share: {
            class: "c1",
          },
        },
      ],
    });
    const ist = def();
    expect(ist()).toHaveClass(["base", "c1"]);
    expect(ist.icon()).toHaveClass(["c1"]);
    expect(ist.base()).toHaveClass(["c1"]);
    expect(ist.other()).not.toHaveClass(["c1"]);
  });
});

describe("Dynamic Compound Variants - Dynamic Classes", () => {
  it("dynamic class", () => {
    const def = cx({
      base: "base",
      variants: { size: { sm: "size-sm", lg: "size-lg" } },
      compounds: [
        { class: (context) => (context.size === "sm" ? "c1" : "") },
        { class: { base: (context) => (context.size === "sm" ? "c1" : "") } },
      ],
    });
    const ist = def({ size: "sm" });
    expect(ist()).toHaveClass(["base", "c1", "size-sm"]);
    const ist2 = def({ size: "lg" });
    expect(ist2()).toHaveClass(["base", "size-lg"]);
  });

  it("apply dynamic class to specified slots", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon", other: "" },
      compounds: [
        {
          class: "base",
        },
        {
          class: (context, slot) => {
            if (slot === "base") return "b1";
            return "";
          },
        },
      ],
    });
    const ist = def();
    expect(ist()).not.toHaveClass(["c1"]);
    expect(ist()).toHaveClass(["b1"]);
    expect(ist.base()).not.toHaveClass(["c1"]);
    expect(ist.base()).toHaveClass(["b1"]);
    expect(ist.icon()).toHaveClass(["icon"]);
    expect(ist.icon()).not.toHaveClass(["b1"]);
    expect(ist.other()).not.toHaveClass(["c1", "b1"]);
  });

  it("apply dynamic class in $share", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      compounds: [
        { $share: { class: (context, slot) => (slot === "icon" ? "c1" : "") } },
      ],
    });
    const ist = def();
    expect(ist()).not.toHaveClass(["c1"]);
    expect(ist.base()).not.toHaveClass(["c1"]);
    expect(ist.icon()).toHaveClass(["c1"]);
  });
});

describe("Component Extension", () => {
  it("component exposes extensible properties", () => {
    const def = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: { sm: "size-sm" } },
      compounds: [{ size: "sm", class: "c1" }],
      defaultVariants: { size: "lg" },
    });

    expect(def.slots).toMatchObject({ base: "base", icon: "icon" });
    expect(def.variants).toMatchObject({ size: { sm: { base: "size-sm" } } });
    expect(def.compounds).toMatchObject([
      {
        $share: undefined,
        $when: undefined,
        class: {
          base: "c1",
        },
        size: "sm",
      },
    ]);
    expect(def.defaultVariants).toMatchObject({ size: "lg" });
  });

  it("component extension inherits original configuration", () => {
    const defP = cx({
      base: "base",
      slots: { icon: "icon" },
      variants: { size: { sm: "size-sm" } },
      compounds: [{ size: "sm", class: "c1" }],
      defaultVariants: { size: "lg" },
    });
    const def = cx({
      extends: defP,
      base: "base2",
      slots: { btn: "btn" },
      variants: {
        size: { lg: "size-lg", sm: "size-sm2" },
        color: { red: "color-red" },
      },
      compounds: [{ size: "lg", class: "c2" }],
      defaultVariants: { color: "red" },
    });
    expect(def.slots).toMatchObject({
      base: "base base2",
      icon: "icon",
      btn: "btn",
    });
    expect(def.variants).toMatchObject({
      size: { sm: { base: "size-sm size-sm2" }, lg: { base: "size-lg" } },
      color: { red: { base: "color-red" } },
    });
    expect(def.compounds).toMatchObject([
      {
        $share: undefined,
        $when: undefined,
        class: {
          base: "c1",
        },
        size: "sm",
      },
      {
        $share: undefined,
        $when: undefined,
        class: {
          base: "c2",
        },
        size: "lg",
      },
    ]);
    expect(def.defaultVariants).toMatchObject({ size: "lg", color: "red" });
  });
});

describe("Scenario Tests", () => {
  const configuratorStyles = cx({
    base: "w-full max-w-7xl mx-auto p-4 bg-white rounded-lg shadow-lg",
    slots: {
      header: "border-b pb-4 mb-6",
      title: "text-2xl font-bold text-gray-800",
      subtitle: "text-sm text-gray-500 mt-1",
      optionsContainer: "grid gap-6",
      optionGroup: "border rounded-md p-4",
      optionGroupTitle: "font-medium mb-3 text-gray-700",
      optionsList: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3",
      option: "cursor-pointer rounded border p-2 transition-all",
      optionLabel: "mt-1 text-sm text-center",
      preview: "sticky top-4 aspect-square rounded-lg overflow-hidden",
      previewImage: "w-full h-full object-cover",
      actions: "mt-6 flex justify-between",
      priceTag: "text-2xl font-bold text-gray-900",
      addToCartButton: "px-6 py-3 rounded-md font-medium transition-colors",
      errorMessage: "text-sm text-red-500 mt-2",
    },
    variants: {
      theme: {
        light: {
          base: "bg-white text-gray-800",
          header: "border-gray-200",
          optionGroup: "border-gray-200 bg-gray-50",
          option: "border-gray-200 hover:border-gray-300 hover:bg-gray-100",
          addToCartButton: "bg-blue-600 text-white hover:bg-blue-700",
        },
        dark: {
          base: "bg-gray-900 text-gray-100",
          header: "border-gray-700",
          optionGroup: "border-gray-700 bg-gray-800",
          option: "border-gray-700 hover:border-gray-600 hover:bg-gray-800",
          addToCartButton: "bg-blue-500 text-white hover:bg-blue-600",
        },
      },
      size: {
        compact: {
          base: "p-2",
          optionsContainer: "gap-3",
          optionGroup: "p-2",
          optionsList: "gap-2",
          option: "p-1",
          title: "text-xl",
        },
        regular: {
          base: "p-4",
          optionsContainer: "gap-6",
          optionGroup: "p-4",
          optionsList: "gap-3",
          option: "p-2",
          title: "text-2xl",
        },
        expanded: {
          base: "p-6",
          optionsContainer: "gap-8",
          optionGroup: "p-6",
          optionsList: "gap-4",
          option: "p-3",
          title: "text-3xl",
        },
      },
      optionSelected: {
        true: "",
        false: "",
      },
      optionAvailable: {
        true: {},
        false: {
          option: "opacity-50 cursor-not-allowed",
        },
      },
      addToCartEnabled: {
        true: {},
        false: {
          addToCartButton:
            "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400",
        },
      },
    },
    compounds: [
      {
        theme: "light",
        optionSelected: true,
        class: {
          option:
            "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50",
        },
      },
      {
        theme: "dark",
        optionSelected: true,
        class: {
          option:
            "border-blue-400 bg-blue-900 bg-opacity-30 ring-2 ring-blue-400 ring-opacity-50",
        },
      },
      {
        $when: (ctx) => ctx.optionSelected && !ctx.optionAvailable,
        class: {
          option:
            "border-red-300 bg-red-100 ring-2 ring-red-300 ring-opacity-50",
        },
      },
      {
        theme: "light",
        $share: {
          slots: ["errorMessage"],
          class: "text-red-600",
        },
      },
      {
        theme: "dark",
        $share: {
          slots: ["errorMessage"],
          class: "text-red-400",
        },
      },
      {
        $when: (ctx, slot) => slot === "preview" && ctx.$loading,
        $share: {
          class: "animate-pulse bg-gray-300",
        },
      },
    ],
    defaultVariants: {
      theme: "light",
      size: "regular",
      optionSelected: false,
      optionAvailable: true,
      addToCartEnabled: true,
    },
  });

  // Basic test: default variants
  it("generates correct class names with default variants", () => {
    const styles = configuratorStyles();

    // 测试默认变体下的基础类名
    expect(styles.base()).toContain("w-full");
    expect(styles.base()).toContain("max-w-7xl");
    expect(styles.base()).toContain("mx-auto");
    expect(styles.base()).toContain("p-4"); // 来自size: regular
    expect(styles.base()).toContain("bg-white"); // 来自theme: light
    expect(styles.base()).toContain("text-gray-800"); // 来自theme: light

    // 测试默认变体下的插槽类名
    expect(styles.header()).toContain("border-b");
    expect(styles.header()).toContain("pb-4");
    expect(styles.header()).toContain("mb-6");
    expect(styles.header()).toContain("border-gray-200"); // 来自theme: light

    expect(styles.option()).toContain("cursor-pointer");
    expect(styles.option()).toContain("rounded");
    expect(styles.option()).toContain("border");
    expect(styles.option()).toContain("p-2"); // 来自size: regular
    expect(styles.option()).toContain("border-gray-200"); // 来自theme: light
    expect(styles.option()).toContain("hover:border-gray-300"); // 来自theme: light
    expect(styles.option()).not.toContain("opacity-50"); // 因为optionAvailable: true
  });

  // Theme variant test
  it("generates correct class names when switching theme variants", () => {
    // Light theme
    const lightStyles = configuratorStyles({ theme: "light" });
    expect(lightStyles.base()).toContain("bg-white");
    expect(lightStyles.base()).toContain("text-gray-800");
    expect(lightStyles.header()).toContain("border-gray-200");
    expect(lightStyles.optionGroup()).toContain("border-gray-200");
    expect(lightStyles.optionGroup()).toContain("bg-gray-50");
    expect(lightStyles.addToCartButton()).toContain("bg-blue-600");

    // Dark theme
    const darkStyles = configuratorStyles({ theme: "dark" });
    expect(darkStyles.base()).toContain("bg-gray-900");
    expect(darkStyles.base()).toContain("text-gray-100");
    expect(darkStyles.header()).toContain("border-gray-700");
    expect(darkStyles.optionGroup()).toContain("border-gray-700");
    expect(darkStyles.optionGroup()).toContain("bg-gray-800");
    expect(darkStyles.addToCartButton()).toContain("bg-blue-500");
  });

  // Size variant test
  it("generates correct class names when switching size variants", () => {
    // Compact size
    const compactStyles = configuratorStyles({ size: "compact" });
    expect(compactStyles.base()).toContain("p-2");
    expect(compactStyles.optionsContainer()).toContain("gap-3");
    expect(compactStyles.optionGroup()).toContain("p-2");
    expect(compactStyles.optionsList()).toContain("gap-2");
    expect(compactStyles.option()).toContain("p-1");
    expect(compactStyles.title()).toContain("text-xl");

    // Regular size
    const regularStyles = configuratorStyles({ size: "regular" });
    expect(regularStyles.base()).toContain("p-4");
    expect(regularStyles.optionsContainer()).toContain("gap-6");
    expect(regularStyles.optionGroup()).toContain("p-4");
    expect(regularStyles.optionsList()).toContain("gap-3");
    expect(regularStyles.option()).toContain("p-2");
    expect(regularStyles.title()).toContain("text-2xl");

    // Expanded size
    const expandedStyles = configuratorStyles({ size: "expanded" });
    expect(expandedStyles.base()).toContain("p-6");
    expect(expandedStyles.optionsContainer()).toContain("gap-8");
    expect(expandedStyles.optionGroup()).toContain("p-6");
    expect(expandedStyles.optionsList()).toContain("gap-4");
    expect(expandedStyles.option()).toContain("p-3");
    expect(expandedStyles.title()).toContain("text-3xl");
  });

  // State variant test
  it("generates correct class names when switching state variants", () => {
    // Option unavailable
    const unavailableStyles = configuratorStyles({ optionAvailable: false });
    expect(unavailableStyles.option()).toContain("opacity-50");
    expect(unavailableStyles.option()).toContain("cursor-not-allowed");

    // Add to cart button disabled
    const disabledButtonStyles = configuratorStyles({
      addToCartEnabled: false,
    });
    expect(disabledButtonStyles.addToCartButton()).toContain("opacity-50");
    expect(disabledButtonStyles.addToCartButton()).toContain(
      "cursor-not-allowed"
    );
    expect(disabledButtonStyles.addToCartButton()).toContain("bg-gray-400");
    expect(disabledButtonStyles.addToCartButton()).toContain(
      "hover:bg-gray-400"
    );
  });

  // Compound variant test
  it("generates correct class names for compound variants", () => {
    // Light theme + selected option
    const lightSelectedStyles = configuratorStyles({
      theme: "light",
      optionSelected: true,
    });
    expect(lightSelectedStyles.option()).toContain("border-blue-500");
    expect(lightSelectedStyles.option()).toContain("bg-blue-50");
    expect(lightSelectedStyles.option()).toContain("ring-2");
    expect(lightSelectedStyles.option()).toContain("ring-blue-500");

    // Dark theme + selected option
    const darkSelectedStyles = configuratorStyles({
      theme: "dark",
      optionSelected: true,
    });
    expect(darkSelectedStyles.option()).toContain("border-blue-400");
    expect(darkSelectedStyles.option()).toContain("bg-blue-900");
    expect(darkSelectedStyles.option()).toContain("bg-opacity-30");
    expect(darkSelectedStyles.option()).toContain("ring-2");
    expect(darkSelectedStyles.option()).toContain("ring-blue-400");
  });

  // Dynamic condition test
  it("generates correct class names with dynamic condition functions", () => {
    // Selected but unavailable option
    const selectedUnavailableStyles = configuratorStyles({
      optionSelected: true,
      optionAvailable: false,
    });
    expect(selectedUnavailableStyles.option()).toContain("border-red-300");
    expect(selectedUnavailableStyles.option()).toContain("bg-red-100");
    expect(selectedUnavailableStyles.option()).toContain("ring-2");
    expect(selectedUnavailableStyles.option()).toContain("ring-red-300");

    // Preview area loading state
    const loadingStyles = configuratorStyles({ $loading: true });
    expect(loadingStyles.preview()).toContain("animate-pulse");
    expect(loadingStyles.preview()).toContain("bg-gray-300");

    // Non-loading state
    const notLoadingStyles = configuratorStyles({ $loading: false });
    expect(notLoadingStyles.preview()).not.toContain("animate-pulse");
    expect(notLoadingStyles.preview()).not.toContain("bg-gray-300");
  });

  // Shared style test
  it("applies shared styles to multiple slots", () => {
    // Error message in light theme
    const lightStyles = configuratorStyles({ theme: "light" });
    expect(lightStyles.errorMessage()).toContain("text-red-600");

    // Error message in dark theme
    const darkStyles = configuratorStyles({ theme: "dark" });
    expect(darkStyles.errorMessage()).toContain("text-red-400");
  });

  // Multiple variant combination test
  it("generates correct class names with multiple variant combinations", () => {
    // Dark theme + compact size + selected option
    const complexStyles = configuratorStyles({
      theme: "dark",
      size: "compact",
      optionSelected: true,
    });

    // Base class test
    expect(complexStyles.base()).toContain("bg-gray-900"); // from theme: dark
    expect(complexStyles.base()).toContain("text-gray-100"); // from theme: dark
    expect(complexStyles.base()).toContain("p-2"); // from size: compact

    // Option class test
    expect(complexStyles.option()).toContain("p-1"); // from size: compact
    expect(complexStyles.option()).toContain("border-blue-400"); // from compound variant
    expect(complexStyles.option()).toContain("bg-blue-900"); // from compound variant
    expect(complexStyles.option()).toContain("border-gray-700"); // from theme: dark

    // Title class test
    expect(complexStyles.title()).toContain("text-xl"); // from size: compact
    expect(complexStyles.title()).toContain("font-bold"); // from base class
  });

  // Functional class test
  it("generates correct class names with functional classes", () => {
    // Create style definition with functional classes
    const functionalStyles = cx({
      base: "container",
      slots: {
        dynamic: "base-dynamic",
      },
      compounds: [
        {
          class: (ctx) => (ctx.$count > 5 ? "count-high" : "count-low"),
        },
        {
          class: {
            dynamic: (ctx) => `level-${ctx.$level || 1}`,
          },
        },
      ],
    });

    // Test class name generation in different contexts
    const lowCountStyles = functionalStyles({ $count: 3, $level: 2 });
    expect(lowCountStyles.base()).toContain("count-low");
    expect(lowCountStyles.dynamic()).toContain("level-2");

    const highCountStyles = functionalStyles({ $count: 8, $level: 5 });
    expect(highCountStyles.base()).toContain("count-high");
    expect(highCountStyles.dynamic()).toContain("level-5");
  });

  // Slot-specific condition test
  it("generates correct class names based on slot conditions", () => {
    // Create style with slot-specific conditions
    const slotConditionStyles = cx({
      base: "base-class",
      slots: {
        header: "header-class",
        footer: "footer-class",
      },
      compounds: [
        {
          $when: (ctx, slot) => slot === "header" && ctx.$isSticky,
          $share: { class: "sticky top-0 z-10" },
        },
        {
          $when: (ctx, slot) => slot === "footer" && ctx.$isFixed,
          $share: { class: "fixed bottom-0 left-0 right-0" },
        },
      ],
    });

    // Test slot conditions with context
    const stickyStyles = slotConditionStyles({
      $isSticky: true,
      $isFixed: true,
    });
    expect(stickyStyles.header()).toContain("sticky");
    expect(stickyStyles.header()).toContain("top-0");
    expect(stickyStyles.header()).toContain("z-10");
    expect(stickyStyles.footer()).toContain("fixed");
    expect(stickyStyles.footer()).toContain("bottom-0");

    // Non-sticky/fixed state
    const normalStyles = slotConditionStyles({
      $isSticky: false,
      $isFixed: false,
    });
    expect(normalStyles.header()).not.toContain("sticky");
    expect(normalStyles.footer()).not.toContain("fixed");
  });

  // Performance test: multiple calls
  it("maintains consistent class name generation with multiple calls", () => {
    const styles = configuratorStyles({ theme: "dark", size: "compact" });

    // 多次调用同一插槽
    const firstCall = styles.base();
    const secondCall = styles.base();
    const thirdCall = styles.base();

    // 验证结果一致
    expect(firstCall).toBe(secondCall);
    expect(secondCall).toBe(thirdCall);

    // 多次调用不同插槽
    const optionCalls = Array(10)
      .fill(0)
      .map(() => styles.option());
    const uniqueResults = new Set(optionCalls);

    // 验证所有调用返回相同结果
    expect(uniqueResults.size).toBe(1);
  });

  // Complex context test
  it("handles complex context to generate correct class names", () => {
    // Create a style with complex context handling
    const complexContextStyles = cx({
      base: "product-card",
      slots: {
        badge:
          "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold",
      },
      compounds: [
        {
          $when: (ctx) => {
            // Complex condition: discount > 20% and stock < 5 and is new
            return ctx.$discount > 20 && ctx.$stock < 5 && ctx.$isNew;
          },
          class: "border-2 border-red-500",
        },
        {
          $when: (ctx) => ctx.$stock === 0,
          class: {
            badge: "bg-red-500 text-white",
          },
        },
        {
          $when: (ctx) => ctx.$stock > 0 && ctx.$stock < 5,
          class: {
            badge: "bg-yellow-500 text-black",
          },
        },
        {
          $when: (ctx) => ctx.$discount >= 15,
          class: {
            badge: (ctx) =>
              `bg-green-500 text-white after:content-["${ctx.$discount}%_OFF"]`,
          },
        },
      ],
    });

    // Test complex condition combinations
    const hotItemStyles = complexContextStyles({
      $discount: 25,
      $stock: 3,
      $isNew: true,
    });
    expect(hotItemStyles.base()).toContain("border-2");
    expect(hotItemStyles.base()).toContain("border-red-500");
    expect(hotItemStyles.badge()).toContain("bg-yellow-500"); // Low stock badge
    expect(hotItemStyles.badge()).toContain("bg-green-500"); // Discount badge
    expect(hotItemStyles.badge()).toContain('after:content-["25%_OFF"]');

    // Out of stock item
    const outOfStockStyles = complexContextStyles({
      $discount: 10,
      $stock: 0,
      $isNew: false,
    });
    expect(outOfStockStyles.base()).not.toContain("border-2");
    expect(outOfStockStyles.badge()).toContain("bg-red-500");
    expect(outOfStockStyles.badge()).not.toContain("after:content");
  });
});
