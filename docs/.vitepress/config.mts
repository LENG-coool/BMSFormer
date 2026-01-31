import { defineConfig } from 'vitepress'
import katex from 'markdown-it-katex'

export default defineConfig({
  base: '/BMSFormer/',
  title: 'BMSFormer',
  lang: 'zh-CN',

  locales: {
    root: { 
      label: '简体中文', 
      lang: 'zh-CN', 
      link: '/', 
      themeConfig: {

      }
    }, 
    en: { 
      label: 'English', 
      lang: 'en-US', 
      link: '/en/', 
      themeConfig: {

      }
    },
    it: { 
      label: 'Italiano', 
      lang: 'it-IT', 
      link: '/it/', 
      themeConfig: {

      }
    },
    ru: { 
      label: 'Русский', 
      lang: 'ru-RU', 
      link: '/ru/', 
      themeConfig: {

      }
    }
  },

  themeConfig: {
    logoLink: '#',                  
    socialLinks: [{ icon: 'github', link: 'https://github.com/LENG-coool/BMSFormer' }],
    
    sidebar: {
        /* 中文侧边栏 */
        '/BMSF/': [{
          text: '文章大纲',
          items: [
            { text: '引言', link: '/BMSF/index#引言' },
            { text: 'SOH方法', link: '/BMSF/index#SOH方法' },
            { text: 'BMSFormer模型', link: '/BMSF/index#BMSFormer模型' },
            { text: '实验表现', link: '/BMSF/index#实验表现' },
            { text: '原始文献', link: '/BMSF/index#原始文献' }
          ]
        }],

        /* English Sidebar */
        '/en/BMSF/': [{
          text: 'Outline',
          items: [
            { text: 'Introduction', link: '/en/BMSF/index#introduction' },
            { text: 'SOH Methods', link: '/en/BMSF/index#soh-methods' },
            { text: 'BMSFormer Model', link: '/en/BMSF/index#bmsformer-model' },
            { text: 'Experimental Results', link: '/en/BMSF/index#experimental-results' },
            { text: 'References', link: '/en/BMSF/index#references' }
          ]
        }],

        /* Italiano Sidebar */
        '/it/BMSF/': [{
          text: 'Sommario',
          items: [
            { text: 'Introduzione', link: '/it/BMSF/index#introduzione' },
            { text: 'Metodi SOH', link: '/it/BMSF/index#metodi-soh' },
            { text: 'Modello BMSFormer', link: '/it/BMSF/index#modello-bmsformer' },
            { text: 'Risultati Sperimentali', link: '/it/BMSF/index#risultati-sperimentali' },
            { text: 'Bibliografia', link: '/it/BMSF/index#bibliografia' }
          ]
        }],

        /* Русский Sidebar */
        '/ru/BMSF/': [{
          text: 'Содержание',
          items: [
            { text: 'Введение', link: '/ru/BMSF/index#введение' },
            { text: 'Методы SOH', link: '/ru/BMSF/index#методы-soh' },
            { text: 'Модель BMSFormer', link: '/ru/BMSF/index#модель-bmsformer' },
            { text: 'Результаты экспериментов', link: '/ru/BMSF/index#результаты-экспериментов' },
            { text: 'Литература', link: '/ru/BMSF/index#литература' }
          ]
        }],
      }
  }
})