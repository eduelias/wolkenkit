import { AskInfrastructure } from '../elements/AskInfrastructure';
import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { InfrastructureDefinition } from './InfrastructureDefinition';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { validateInfrastructureDefinition } from '../validators/validateInfrastructureDefinition';

const getInfrastructureDefinition = async function ({ infrastructureDirectory }: {
  infrastructureDirectory: string;
}): Promise<InfrastructureDefinition<AskInfrastructure, TellInfrastructure>> {
  if (!await exists({ path: infrastructureDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/infrastructure' not found.`);
  }

  let infrastructureDefinition: InfrastructureDefinition<AskInfrastructure, TellInfrastructure>;

  try {
    infrastructureDefinition = (await import(infrastructureDirectory)).default;
  } catch (ex) {
    if (ex instanceof SyntaxError) {
      throw new errors.ApplicationMalformed(`Syntax error in '<app>/build/server/infrastructure'.`, { cause: ex });
    }

    // But throw an error if the entry is a directory without importable content.
    throw new errors.FileNotFound(`No infrastructure definition in '<app>/build/server/infrastructure' found.`);
  }

  try {
    validateInfrastructureDefinition({ infrastructureDefinition });
  } catch (ex) {
    throw new errors.InfrastructureDefinitionMalformed(`Infrastructure definition '<app>/build/server/infrastructure' is malformed: ${ex.message}`);
  }

  return infrastructureDefinition;
};

export { getInfrastructureDefinition };
