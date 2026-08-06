import type React from 'react';
import * as ReactNative from 'react-native';
import nativeStyled, { css as nativeCss, useTheme as useNativeTheme } from 'styled-components/native';

import type { AgroTheme } from './theme';

type PropsOf<T> = T extends React.ElementType ? React.ComponentPropsWithRef<T> : object;

type ThemedInterpolation<Props extends object> =
  | string
  | number
  | false
  | null
  | undefined
  | ReturnType<typeof nativeCss>
  | ((props: Props & { theme: AgroTheme }) => unknown);

type ThemedFactory<BaseProps extends object> = {
  <ExtraProps extends object = object>(
    strings: TemplateStringsArray,
    ...interpolations: ThemedInterpolation<BaseProps & ExtraProps>[]
  ): React.ComponentType<BaseProps & ExtraProps>;
  attrs<ExtraProps extends object = object>(
    attrs:
      | Partial<BaseProps & ExtraProps>
      | ((props: BaseProps & ExtraProps & { theme: AgroTheme }) => Partial<BaseProps & ExtraProps>),
  ): ThemedFactory<Omit<BaseProps, keyof ExtraProps> & Partial<ExtraProps>>;
};

type NativeAliases = {
  [Key in keyof typeof ReactNative as (typeof ReactNative)[Key] extends React.ComponentType<any> ? Key : never]:
    ThemedFactory<PropsOf<(typeof ReactNative)[Key]>>;
};

type ThemedNativeStyled = NativeAliases & (<Component extends React.ElementType>(
  component: Component,
) => ThemedFactory<React.ComponentPropsWithRef<Component>>);

export const useTheme = useNativeTheme as () => AgroTheme;
export const css = nativeCss as <Props extends object = object>(
  strings: TemplateStringsArray,
  ...interpolations: ThemedInterpolation<Props>[]
) => ReturnType<typeof nativeCss>;
export default nativeStyled as unknown as ThemedNativeStyled;
