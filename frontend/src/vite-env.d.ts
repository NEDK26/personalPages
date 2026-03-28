/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "react-responsive-masonry" {
  import type { CSSProperties, ReactNode } from "react";

  interface MasonryProps {
    children: ReactNode;
    columnsCount?: number;
    gutter?: string;
    className?: string;
    style?: CSSProperties;
    sequential?: boolean;
  }

  interface ResponsiveMasonryProps {
    children: ReactNode;
    columnsCountBreakPoints?: Record<number, number>;
    gutterBreakPoints?: Record<number, string>;
    className?: string;
  }

  const Masonry: (props: MasonryProps) => JSX.Element;
  export function ResponsiveMasonry(props: ResponsiveMasonryProps): JSX.Element;
  export default Masonry;
}
