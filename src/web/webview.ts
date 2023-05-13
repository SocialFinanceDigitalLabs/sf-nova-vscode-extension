
export function getWebviewContent(stliteVersion: string) {
    console.log("STARTING WEBVIEW CONTENT WITH VERSION", stliteVersion);
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>stlite app</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@stlite/mountable@${stliteVersion}/build/stlite.css"
        />
      </head>
      <body>
        <div id="root"></div>
        <script src="https://cdn.jsdelivr.net/npm/@stlite/mountable@${stliteVersion}/build/stlite.js"></script>
        <script>
          const vscode = acquireVsCodeApi();
  
          // Streamlit's withHostCommunication accesses window.parent.postMessage, which is not available in the webview, so we need to mock it.
          window.parent = {
            postMessage: (msg) => {
              vscode.postMessage(msg);
            }
          };
  
          let stliteCtx = null;
  
          window.addEventListener('message', event => {
            console.debug("event.data:", event.data);
  
            const message = event.data;
  
            switch (message.type) {
              case 'init': {
                const { mountOptions } = message.data;
                stliteCtx = stlite.mount(mountOptions, document.getElementById("root"));
                vscode.postMessage({
                  type: "init:done",
                });
                break;
              }
              case 'file:write': {
                const { path, content } = message.data;
                stliteCtx.writeFile(path, content);
                break;
              }
              case 'file:delete': {
                const { path } = message.data;
                stliteCtx.unlink(path);
                break;
              }
              case 'install': {
                const { requirements } = message.data;
                stliteCtx.install(requirements);
                break;
              }
            }
          });
        </script>
      </body>
    </html>`;
  }
  