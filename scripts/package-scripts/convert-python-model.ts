import yargs from 'yargs';
import path from 'path';
import { mkdirp } from 'fs-extra';
import { runDocker } from './utils/runDocker';
import { getString } from './prompt/getString';

/****
 * Type Definitions
 */

/****
 * Constants
 */
const ROOT_DIR = path.resolve(__dirname, '../..');

/****
 * Main function
 */
const convertPythonModel = async (modelPath: string, _outputDirectory: string): Promise<void> => {
  if (path.isAbsolute(_outputDirectory)) {
    throw new Error('For an output directory, you must specify a single name of the model folder, it looks like you specified an absolute path.')
  }
  if (!path.isAbsolute(modelPath)) {
    throw new Error('The model path is not an absolute path.');
  }
  const outputDirectory = path.resolve(ROOT_DIR, 'models', _outputDirectory, 'models');
  await mkdirp(outputDirectory);
  const inputFolder = path.resolve(path.dirname(modelPath));
  const modelName = modelPath.split('/').pop();
  await runDocker('evenchange4/docker-tfjs-converter', [
    'tensorflowjs_converter',
    '--input_format=keras',
    `/model/${modelName}`,
    `/output/${modelName?.split('.').slice(0, -1).join('.')}`,
  ].join(' '), {
    volumes: [
      {
        internal: '/model',
        external: inputFolder,
      },
      {
        internal: '/output',
        external: path.resolve(outputDirectory),
      },
    ]
  });
};

export default convertPythonModel;

/****
 * Functions to expose the main function as a CLI tool
 */

type Answers = { modelPath: string; outputDirectory: string }

const getArgs = async (): Promise<Answers> => {
  const argv = await yargs.command('convert python model', 'build models', yargs => {
    yargs.positional('model', {
      describe: 'The model to build',
    }).positional('output', {
      describe: 'The model package to place model outputs',
    });
  })
    .help()
    .argv;

  const modelPath = await getString('Which hdf5 model do you want to build?', argv._[0]);
  const outputDirectory = await getString('What model package do you want to write the output to? If this does not exist, it will be created.', argv._[1]);

  return {
    modelPath,
    outputDirectory,
  }
}

if (require.main === module) {
  (async () => {
    const { modelPath, outputDirectory } = await getArgs();
    convertPythonModel(modelPath, outputDirectory);
  })();
}