'use client'
import { useLanguage } from '../../language'

export function BlogContent() {
  const { language } = useLanguage()
  return language === 'zh' ? (
    <><h1>关于这个博客</h1><p>这里是我的个人博客，用来整理技术实践、项目中的问题和一些思考。</p><p>欢迎通过首页的联系方式交流。</p></>
  ) : (
    <><h1>About this blog</h1><p>This is my personal blog, a place to share notes on engineering, project challenges, and ideas.</p><p>Feel free to get in touch using the links on the homepage.</p></>
  )
}
