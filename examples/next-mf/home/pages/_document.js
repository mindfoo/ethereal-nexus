import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";
import { revalidate, FlushedChunks, flushChunks } from "@module-federation/nextjs-mf/utils";
import {init, loadRemote} from '@module-federation/runtime'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const remotes = isServer => {
      const location = isServer ? 'ssr' : 'chunks';
      return [
        {
          name: 'remote',
          entry:`http://localhost:3002/_next/static/${location}/remoteEntry.js`
        }
      ];
    };

    init({
      name: 'home',
      remotes: remotes(typeof window === 'undefined'),
      force: true
    })
    if(process.env.NODE_ENV === "development" && !ctx.req.url.includes("_next")) {
      await revalidate().then((shouldReload) =>{
        if (shouldReload) {
          ctx.res.writeHead(302, { Location: ctx.req.url });
          ctx.res.end();
        }
      });
    } else {
      ctx?.res?.on("finish", () => {
        revalidate()
      });
    }
    const initialProps = await Document.getInitialProps(ctx);
    const chunks = await flushChunks()

    return {
      ...initialProps,
      chunks
    };

  }

  render() {

    return (
      <Html>
        <Head>
          <meta name="robots" content="noindex" />
          <FlushedChunks chunks={this.props.chunks} />
        </Head>

        <body className="bg-background-grey">
        <Main />
        <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
