import 'styled-components/native';

import type { AgroTheme } from './theme';

declare module 'styled-components/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefaultTheme extends AgroTheme {}
}

