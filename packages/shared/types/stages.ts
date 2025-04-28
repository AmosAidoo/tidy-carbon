import { DestinationType } from "./destinations";
import { SourceType } from "./sources";
import { TransformationType } from "./transformations";

export enum StageType {
  Source = "Source",
  Transformation = "Transformation",
  Destination = "Destination"
}

export type StageSubType = TransformationType | SourceType | DestinationType