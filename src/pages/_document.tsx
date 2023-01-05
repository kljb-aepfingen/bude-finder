import {Head, Html, Main, NextScript} from 'next/document'

const Document = () => {
  return <Html>
    <Head>
      <meta name="description" content="Findet buden in deiner Umgebung" />
      <link rel="icon" href="/favicon.ico" />
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8241943697814118" crossOrigin="anonymous"></script>
      <script async defer src="/temp.js"></script>
    </Head>
    <body>
      <Main/>
      <NextScript/>
    </body>
  </Html>
}

export default Document