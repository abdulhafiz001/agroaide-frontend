import 'styled-components';
import 'styled-components/native';
import 'styled-components/native/dist/models/ThemeProvider';

import type { AgroTheme } from './theme';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefaultTheme extends AgroTheme {}
}

declare module 'styled-components/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefaultTheme extends AgroTheme {}
}

declare module 'styled-components/native/dist/models/ThemeProvider' {
  // styled-components v6 ships an isolated native theme declaration.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefaultTheme extends AgroTheme {}
}

