declare module "react-simple-maps" {
  import * as React from "react";

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?: string | ((...args: any[]) => any);
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
    };
  }

  export class ComposableMap extends React.Component<ComposableMapProps> {}

  export interface GeographiesProps {
    geography?: string | Record<string, any> | string[];
    children?: (data: { geographies: any[]; outline: any; borders: any }) => React.ReactNode;
    parseGeographies?: (geos: any[]) => any[];
  }

  export class Geographies extends React.Component<GeographiesProps> {}

  export interface GeographyProps extends Omit<React.SVGProps<SVGPathElement>, "geography" | "style"> {
    geography?: any;
    center?: [number, number];
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export class Geography extends React.Component<GeographyProps> {}

  export interface ZoomableGroupProps extends React.SVGProps<SVGGElement> {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (position: { center: [number, number]; zoom: number }) => void;
    onMoveEnd?: (position: { center: [number, number]; zoom: number }) => void;
    filterZoomEvent?: (evt: any) => boolean;
  }

  export class ZoomableGroup extends React.Component<ZoomableGroupProps> {}
}
