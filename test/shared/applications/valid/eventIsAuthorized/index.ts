import path from 'path';
import setupApplication from '../../setupApplication';

const eventIsAuthorized = async function (): Promise<string> {
  const directory = await setupApplication({
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

export default eventIsAuthorized;
