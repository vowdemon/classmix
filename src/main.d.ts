type WrapperFn = (input: string) => string;

type ClassValueBase =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[];
type ClassValue = ClassValueBase | Record<string, any>;

type VariantValue<T> = keyof T | (string & {}) | boolean | undefined;
type VariantContext<V extends VariantsType> = {
  [K in keyof V]: VariantValue<V[K]>;
} & {
  [key: `$${string}`]: any;
};

type MaybeRecord<S extends string, T> = T | { [K in S | "base"]?: T };

type ClassApplyValue<
  S extends ClassmixSlot,
  V extends VariantsType<S>,
  _C extends DynamicClassFn<S, V>
> = MaybeRecord<S, DynamicClassFn<S, V> | ClassValue>;

type ClassApply<
  S extends ClassmixSlot,
  V extends VariantsType,
  C extends DynamicClassFn<S, V>
> = {
  class?: ClassApplyValue<S, V, C>;
} & {
  $share?: {
    slots?: S[];
    class?: C | ClassValue;
  };
};

type DynamicClassFn<S extends ClassmixSlot, V extends VariantsType> = (
  context: VariantContext<V>,
  slot: S
) => ClassValue;
type DynamicWhenFn<S extends ClassmixSlot, V extends VariantsType> = (
  context: VariantContext<V>,
  slot: S
) => boolean;

type CompoundType<
  S extends ClassmixSlot,
  V extends VariantsType<S>,
  W extends DynamicWhenFn<S, V>,
  C extends DynamicClassFn<S, V>
> =
  | ClassApply<S, V, C>
  | ({
      [K in keyof V]?: VariantValue<V[K]>;
    } & ClassApply<S, V, C>)
  | ({
      $when: W;
    } & ClassApply<S, V, C>);

type VariantsType<
  S extends ClassmixSlot = any,
  VK extends string = string
> = Record<
  VK,
  Record<string, ClassValueBase | Partial<Record<S | "base", ClassValue>>>
>;

type ClassmixBase = ClassValue;
type ClassmixSlot = "base" | (string & {});
type ClassmixVariantsKey = string;
type ClassmixVariants<S extends ClassmixSlot = any> = VariantsType<
  S | "base",
  ClassmixVariantsKey
>;
type ClassmixDefaultVariants<V extends ClassmixVariants> = {
  [K in keyof V]?: VariantValue<V[K]>;
};

type ClassmixApplyContext<V extends VariantsType> = {
  [K in keyof V]?: VariantValue<V[K]>;
} & {
  [key: `$${string}`]: any;
} & { class?: ClassValue };

type ClassmixApply<S extends ClassmixSlot, V extends ClassmixVariants<S>> = {
  (context?: Partial<ClassmixApplyContext<V>>): string;
} & {
  [s in S | "base"]: (context?: ClassmixApplyContext<V>) => string;
};
type Classmix<
  S extends ClassmixSlot = any,
  V extends ClassmixVariants<S> = any
> = {
  (context?: Partial<ClassmixApplyContext<V>>): ClassmixApply<S, V>;
  slots: Record<S | "base", ClassValue>;
  variants: V;
  compounds: CompoundType<
    S | "base",
    V,
    DynamicWhenFn<S | "base", V>,
    DynamicClassFn<S | "base", V>
  >[];
  defaultVariants: ClassmixDefaultVariants<V>;
};

export declare function createClassmix(
  wrapperFn?: WrapperFn
): <
  B extends ClassmixBase = "",
  S extends ClassmixSlot = "base",
  V extends ClassmixVariants<S> = {},
  C extends CompoundType<
    S | "base",
    V,
    DynamicWhenFn<S | "base", V>,
    DynamicClassFn<S | "base", V>
  >[] = CompoundType<
    S | "base",
    V,
    DynamicWhenFn<S | "base", V>,
    DynamicClassFn<S | "base", V>
  >[],
  D extends ClassmixDefaultVariants<V> = {},
  E extends Classmix<any, any> = any
>(config: {
  extends?: E;
  base?: B;
  slots?: Partial<Record<S, ClassValue>>;
  variants?: V;
  compounds?: C;
  defaultVariants?: D;
}) => Classmix<S, V>;

type BooleanVairantPropValue<PropValues extends PropertyKey> =
  | PropValues
  | ("true" extends PropValues ? true : never)
  | ("false" extends PropValues ? false : never);

export type VariantProps<CX extends Classmix> = CX extends Classmix<
  any,
  infer V
>
  ? {
      [K in keyof V]: BooleanVairantPropValue<keyof V[K]>;
    }
  : never;
