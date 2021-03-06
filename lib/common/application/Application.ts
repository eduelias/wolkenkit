import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainDefinition } from './DomainDefinition';
import { FlowsDefinition } from './FlowsDefinition';
import { Hooks } from '../elements/Hooks';
import { PackageManifest } from './PackageManifest';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { ViewsDefinition } from './ViewsDefinition';

export interface Application {
  rootDirectory: string;

  packageManifest: PackageManifest;

  domain: DomainDefinition;

  flows: FlowsDefinition;

  hooks: Hooks<AskInfrastructure & TellInfrastructure>;

  infrastructure: AskInfrastructure & TellInfrastructure;

  views: ViewsDefinition;
}
