import {Head, Html, Main, NextScript} from 'next/document'

const Document = () => {
  return <Html>
    <Head>
      <meta name="description" content="Findet buden in deiner Umgebung" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <body>
      <Main/>
      <NextScript/>
    </body>
  </Html>
}

export default Document