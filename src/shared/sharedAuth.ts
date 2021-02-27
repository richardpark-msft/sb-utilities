export function getConnectionStringFromEnvironment(envVarName: string): string {
  const value = process.env[envVarName];
  if (!value) {
    throw new Error(`${envVarName} was not defined in the environment (or is empty)`);
  }

  return value;
}
