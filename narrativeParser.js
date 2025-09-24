const { db } = require("./database")

function parseNarrativeText(narrativeText) {
  const nodeContents = []
  const choiceData = []

  // Split by node markers: ---NODE: node_name---
  const blocks = narrativeText.split(/---NODE:\s*(.+?)---/)

  for (let i = 1; i < blocks.length; i += 2) {
    const nodeName = blocks[i].trim()
    const blockContent = blocks[i + 1]

    if (!blockContent) continue

    // Extract content and choices
    const lines = blockContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l)

    let content = ""
    let inContent = false
    let choiceOrder = 1

    for (const line of lines) {
      if (line === "CONTENT:" || line.startsWith("CONTENT:")) {
        inContent = true
        continue
      }

      if (line === "CHOICES:" || line.startsWith("CHOICES:")) {
        inContent = false
        continue
      }

      if (line === "---END NODE---") {
        break
      }

      if (inContent) {
        content += line + " "
      }

      // Parse choices: A) Go left → forest_path
      const choiceMatch = line.match(/^[ABC]\)\s*(.+?)\s*→\s*(.+)$/)
      if (choiceMatch) {
        choiceData.push({
          parentNodeName: nodeName,
          childNodeName: choiceMatch[2].trim(),
          choiceText: choiceMatch[1].trim(),
          choiceOrder: choiceOrder++,
        })
      }
    }

    if (content.trim()) {
      nodeContents.push({
        nodeName,
        content: content.trim(),
      })
    }
  }

  return { nodeContents, choiceData }
}

async function saveNarrativeGraph(
  articleId,
  narrativeTitle,
  nodeContents,
  choiceData
) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Create narrative
      db.run(
        "INSERT INTO narratives (article_id, title) VALUES (?, ?)",
        [articleId, narrativeTitle],
        function (err) {
          if (err) {
            reject(err)
            return
          }

          const narrativeId = this.lastID

          // 2. Insert all nodes first to get their IDs
          const nodeStmt = db.prepare(`
            INSERT INTO story_nodes (narrative_id, content) VALUES (?, ?)
          `)

          const nodeNameToId = {}
          let nodesProcessed = 0

          nodeContents.forEach((node, index) => {
            nodeStmt.run([narrativeId, node.content], function (err) {
              if (err) {
                reject(err)
                return
              }

              nodeNameToId[node.nodeName] = this.lastID
              nodesProcessed++

              // When all nodes are inserted, create choices
              if (nodesProcessed === nodeContents.length) {
                createChoices()
              }
            })
          })

          function createChoices() {
            nodeStmt.finalize()

            const choiceStmt = db.prepare(`
              INSERT INTO choices (narrative_id, parent_node_id, child_node_id, choice_text, choice_order) 
              VALUES (?, ?, ?, ?, ?)
            `)

            let choicesProcessed = 0

            if (choiceData.length === 0) {
              resolve(narrativeId)
              return
            }

            choiceData.forEach((choice) => {
              const parentId = nodeNameToId[choice.parentNodeName]
              const childId = nodeNameToId[choice.childNodeName]

              if (parentId && childId) {
                choiceStmt.run(
                  [
                    narrativeId,
                    parentId,
                    childId,
                    choice.choiceText,
                    choice.choiceOrder,
                  ],
                  function (err) {
                    if (err) {
                      reject(err)
                      return
                    }

                    choicesProcessed++
                    if (choicesProcessed === choiceData.length) {
                      choiceStmt.finalize()
                      resolve(narrativeId)
                    }
                  }
                )
              } else {
                console.warn(
                  `Missing node for choice: ${choice.parentNodeName} → ${choice.childNodeName}`
                )
                choicesProcessed++
                if (choicesProcessed === choiceData.length) {
                  choiceStmt.finalize()
                  resolve(narrativeId)
                }
              }
            })
          }
        }
      )
    })
  })
}

module.exports = { parseNarrativeText, saveNarrativeGraph }
