'use client'

import { useLanguage } from '../../language'

export function BlogContent() {
  const { language } = useLanguage()

  if (language === 'zh') {
    return (
      <>
        <h1>AI Agent 换模型时，什么时候该停止重试？</h1>
        <p>
          我给 Pi Agent 写了一个叫 <a href="https://github.com/NEDK26/freeAgent">FreeAgent</a> 的插件，可以把几个模型排成一条回退链。当前模型遇到限流，Pi 自己的重试用完之后，插件就有机会尝试下一个模型。写到这里我遇到一个问题。如果 Agent 已经做了一半，换个模型还能从头再来吗？
        </p>

        <h2>报错之前，工单可能已经建好了</h2>
        <p>
          假设我让 Agent 根据一段日志创建工单，并把链接发给我。它先调用工具，工单已经建好。随后模型在整理回复时遇到限流，我只看到了报错。如果把原任务原样交给备用模型，它可能重新调用工具，于是同一个问题有了两张工单。
        </p>
        <p>
          工具执行成功和模型给出答复，是两件分开的事。工单系统已经接受了写入，模型请求后续失败时，前面的写入依然有效。
        </p>

        <h2>我把自动回退停在工具调用之后</h2>
        <p>
          FreeAgent 会先让 Pi 完成原有的重试。对于能识别的限流或临时故障，有备用模型时再尝试切换。遇到已经执行过工具的请求，插件默认停止自动重放。这会让一些可以继续的任务停下来，比如之前只读了一份文件。我接受这个代价，因为插件未必知道每个工具做了什么，更难判断再执行一次会产生什么结果。
        </p>

        <h2>如果以后要自动接着做</h2>
        <p>
          我会先从创建工单这一类动作入手。调用前生成一个操作编号，把它一并写进工单。遇到中断时，先按编号查结果。工单已经存在，就把现有链接交给备用模型，让它接着回复。这样即使换了模型，任务也能从最近一个已确认的步骤往下走。
        </p>
      </>
    )
  }

  return (
    <>
      <h1>When should an AI agent stop retrying?</h1>
      <p>
        I built <a href="https://github.com/NEDK26/freeAgent">FreeAgent</a>, a Pi Agent plugin that puts models in a fallback order. If a model gets rate-limited and Pi exhausts its own retries, the plugin can try the next one. A harder question came up while building it. How much of the task can I safely replay if the agent is already halfway through?
      </p>

      <h2>The issue might already exist</h2>
      <p>
        Suppose I ask an agent to create an issue from a log and send me the link. Its tool creates the issue. The model then hits a rate limit while composing its reply, so all I see is an error. If I give the original task to a fallback model, it might call the tool again and create a second issue for the same problem.
      </p>
      <p>
        The tool result and the final reply can succeed or fail independently. The issue tracker has already accepted the write. That write still stands when the model request fails later.
      </p>

      <h2>Why I stop automatic fallback after a tool has run</h2>
      <p>
        FreeAgent lets Pi finish its built-in retries first. For a recognized rate limit or temporary failure, it can then try a configured fallback model. If a tool has already run, the plugin stops automatic replay by default. That stops some tasks that could have continued safely, such as one that only read a file. I accept that trade-off because the plugin may have no way to tell what a tool changed or what running it again would do.
      </p>

      <h2>How I would resume automatically</h2>
      <p>
        I would start with one kind of action, such as creating an issue. I would assign it an operation ID before calling the tool and include that ID in the issue. After an interruption, I could look up the issue by that ID. If it already exists, the fallback model gets its link and can finish the reply. The task resumes from the last step I can confirm.
      </p>
    </>
  )
}
