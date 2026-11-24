'use client'
import { useLanguage } from '../../language'

export function BlogContent() {
  const { language } = useLanguage()
  return language === 'zh' ? (
    <>
      <h1>我会在这里写什么</h1>
      <p>我想把做项目时容易忘掉的细节记下来。遇到了什么问题，试过哪些办法，最后为什么选了现在这一种。</p>
      <p>比如 FreeAgent 遇到限流时会试下一个模型。如果出错的请求里已经执行过工具，重试可能重复执行。于是我让插件默认在这里停下来。这类取舍，就是我想写下来的工程笔记。</p>
      <p>「知行合一」里的记录也会从小事开始。比如先用手头的衣服搭几套日常穿搭，再看看「23 件衣橱」能不能帮我少买不常穿的衣服。我会记下怎么开始、花了多少，以及哪些做法值得留下。</p>
    </>
  ) : (
    <>
      <h1>What I write about</h1>
      <p>I want to write down the details I tend to forget after finishing a project. What was the problem? What did I try, and why did I settle on the approach I shipped?</p>
      <p>FreeAgent, for example, tries the next model when it hits a rate limit. If the failed request already ran a tool, retrying might run it twice. So the plugin stops by default at that point. Those are the kinds of engineering decisions I want to document.</p>
      <p>I take the same approach with Ideas into Action. For a 23-piece wardrobe, I want to start by putting together a few everyday outfits from clothes I already own and see whether that helps me buy fewer things I rarely wear. I&apos;ll write down how I started, what it cost, and what I&apos;d keep doing.</p>
    </>
  )
}
