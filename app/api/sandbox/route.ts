import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { exec } from 'child_process';
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec);

const sandboxTimeout = 10 * 60 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    apiKey,
  }: { fragment: FragmentSchema; userID: string; apiKey?: string } =
    await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)
  // console.log('apiKey', apiKey)

  // Create a interpreter or a sandbox
  // const sbx = await Sandbox.create(fragment.template, {
  //   metadata: { template: fragment.template, userID: userID },
  //   timeoutMs: sandboxTimeout,
  //   apiKey,
  // })
  let internalPort
  switch (fragment.template) {
    case "nextjs-developer":
      internalPort = 3000
      break
    case "vue-developer":
      internalPort = 3000
      break
    case "gradio-developer":
      internalPort = 7861
      break
    case "streamlit-developer":
      internalPort = 8501
      break
    default:
      internalPort = 8080
  }

  let containerName = `${fragment.template}-container-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').substring(0, 8)}`;

  await execAsync(`docker build -t ${fragment.template}-image .`, { cwd: `/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}` });
  console.log('Docker image built successfully');
  while (true) {
    try {
      if (fragment.template === "python-code-interpreter") {
        await execAsync(`docker run -d --name ${containerName}  ${fragment.template}-image sleep ${sandboxTimeout}`);
        break
      }
      else if ((fragment.template === "nextjs-developer") || (fragment.template === "vue-developer") || (fragment.template === "gradio-developer") || (fragment.template === "streamlit-developer")) {
        await execAsync(`docker run -d --name ${containerName} -p ${fragment.port || 3001}:${internalPort} ${fragment.template}-image sleep ${sandboxTimeout}`);
        break
      }
    } catch (e) {
      containerName = `${fragment.template}-container-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').substring(0, 8)}`;
    }
  }
  console.log('Container start successfully');

  setTimeout(() => {
    stopAndDeleteContainer(containerName)
  }, sandboxTimeout * 1000)

  // Install packages
  if (fragment.has_additional_dependencies) {
    // await sbx.commands.run(fragment.install_dependencies_command)
    // console.log(
    //   `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
    // )
    await execAsync(`docker exec ${containerName} bash -c "${fragment.install_dependencies_command}"`);
    console.log(`Installed dependencies: ${fragment.additional_dependencies.join(', ')}`)
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    // fragment.code.forEach(async (file) => {
    //   await sbx.files.write(file.file_path, file.file_content)
    //   console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
    // })
    fragment.code.forEach(async (file) => {
      fs.mkdirSync(path.dirname(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${file.file_path}`), { recursive: true });
      try {
        fs.writeFileSync(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${file.file_path}`, file.file_content);
        console.log('Cache file written successfully');
      } catch (err) {
        console.error('Error writing to cache file:', err);
      }
      await execAsync(`docker exec ${containerName} bash -c "mkdir -p '${path.dirname(fragment.file_path)}'"`);
      await execAsync(`docker cp /home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${file.file_path} ${containerName}:/home/user/${file.file_path}`);
      try {
        fs.unlinkSync(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${file.file_path}`);
        console.log('Cache file deleted successfully');
      } catch (err) {
        console.error('Error deleting cache file:', err);
      }
      console.log(`Copied file to ${file.file_path}`)
    })
  } else {
    // await sbx.files.write(fragment.file_path, fragment.code)
    // console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
    fs.mkdirSync(path.dirname(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${fragment.file_path}`), { recursive: true });
    try {
      fs.writeFileSync(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${fragment.file_path}`, fragment.code);
      console.log('Cache file written successfully');
    } catch (err) {
      console.error('Error writing to cache file:', err);
    }
    await execAsync(`docker exec ${containerName} bash -c "mkdir -p '${path.dirname(fragment.file_path)}'"`);
    await execAsync(`docker cp /home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${fragment.file_path} ${containerName}:/home/user/${fragment.file_path}`);
    try {
      fs.unlinkSync(`/home/qy/Files/CUHK/fragments/sandbox-templates/${fragment.template}/cache/${fragment.file_path}`);
      console.log('Cache file deleted successfully');
    } catch (err) {
      console.error('Error deleting cache file:', err);
    }
    console.log(`Copied file to ${fragment.file_path}`)
  }

  if (fragment.template === "python-code-interpreter") {
    const { stdout, stderr } = await execAsync(`docker exec ${containerName} bash -c "python script.py"`);
    console.log(stdout)
    console.log(stderr)
    stopAndDeleteContainer(containerName)
    return new Response(
      JSON.stringify({
        sbxId: containerName,
        template: fragment.template,
        stdout: [stdout],
        stderr: [stderr],
        runtimeError: undefined,
        cellResults: [],
      } as ExecutionResultInterpreter),
    )
  }
  else if ((fragment.template === "nextjs-developer") || (fragment.template === "vue-developer") || (fragment.template === "gradio-developer") || (fragment.template === "streamlit-developer")) {
    exec(`docker exec ${containerName} bash -c "/start_server.sh"`, (err, stdout, stderr) => {
      if (err) {
        console.error('Error start server in container:', err);
        return;
      }
    });
    await execAsync(`docker exec ${containerName} bash -c "/ping_server.sh"`);
    console.log(`Server start successfully`)
    return new Response(
      JSON.stringify({
        sbxId: containerName,
        template: fragment.template,
        url: `http://localhost:${fragment.port || 3001}`,
      } as ExecutionResultWeb),
    )
  }

  // Execute code or return a URL to the running sandbox
  // if (fragment.template === 'code-interpreter-v1') {
  //   const { logs, error, results } = await sbx.runCode(fragment.code || '')
  //
  //   return new Response(
  //     JSON.stringify({
  //       sbxId: sbx?.sandboxId,
  //       template: fragment.template,
  //       stdout: logs.stdout,
  //       stderr: logs.stderr,
  //       runtimeError: error,
  //       cellResults: results,
  //     } as ExecutionResultInterpreter),
  //   )
  // }

  // return new Response(
  //   JSON.stringify({
  //     sbxId: sbx?.sandboxId,
  //     template: fragment.template,
  //     url: `https://${sbx?.getHost(fragment.port || 80)}`,
  //   } as ExecutionResultWeb),
  // )
}

const stopAndDeleteContainer = (containerName: string) => {
  exec(`docker stop ${containerName}`, (err) => {
    if (!err) {
      console.log(`${containerName} stopped successfully`)
    }
    exec(`docker rm ${containerName}`, (err) => {
      if (!err) {
        console.log(`${containerName} deleted successfully`)
      }
    })
  })
}
