import { DestinationType } from "./destinations";
import { SourceType } from "./sources";
import { TransformationType } from "./transformations";

export enum StageType {
  Source = "source",
  Transformation = "transformation",
  Destination = "destination"
}

export type StageSubType = TransformationType | SourceType | DestinationType