/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

const IMG = 'https://upload.lntrl.dev/f/beypeyg.jpg'
const RESPONSE_ID = 'popio steps'
const BOT_JID = '259786046210223@bot'

function createImageArtifact() {
  return {
    __typename: 'GenAIImagePrimitive',
    asset_query_status: 'FETCHED',
    preview_image: {
      url: IMG,
      mime_type: 'image/jpeg',
      width: 800,
      height: 450
    },
    full_image: {
      url: IMG,
      mime_type: 'image/jpeg',
      width: 1600,
      height: 900
    },
    source: {
      source_type: 'IMAGE_GEN',
      source_display_name: 'beypeyg.jpg'
    }
  }
}

function createStepEntries() {
  return [
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title'
    },
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title',
      body: 'deskripsi'
    },
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title',
      body: 'title + deskripsi + url',
      sources: [
        {
          __typename: 'GenAIStepWebLinkSource',
          url: 'https://en.wikipedia.org/wiki/Coffee',
          title: 'Coffee — Wikipedia',
          favicon_url: 'https://en.wikipedia.org/static/images/icons/wikipedia.png'
        },
        {
          __typename: 'GenAIStepWebLinkSource',
          url: 'https://github.com',
          title: 'GitHub',
          favicon_url: 'https://github.githubassets.com/favicons/favicon.png'
        }
      ]
    },
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title',
      artifacts: [createImageArtifact()]
    },
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title',
      body: 'title + deskripsi + image',
      artifacts: [createImageArtifact()]
    },
    {
      __typename: 'GenAIStepThoughtEntry',
      header: 'title',
      body: 'title + deskripsi + image + url',
      sources: [
        {
          __typename: 'GenAIStepWebLinkSource',
          url: 'https://www.healthline.com/nutrition/coffee-benefits',
          title: 'Coffee: Health Benefits, Nutrition, and Risks — Healthline',
          favicon_url: 'https://www.healthline.com/favicon.ico'
        }
      ],
      artifacts: [createImageArtifact()]
    }
  ]
}

function createEmbeddedScreens(stepEntries) {
  return [
    {
      __typename: 'FOAUnifiedResponseEmbeddedScreen',
      title: 'Thoughts',
      content: [
        {
          __typename: 'FOAEmbeddedScreenContentTabbed',
          tabs: [
            {
              __typename: 'FOAUnifiedResponseTab',
              id: 'steps',
              tab_header: 'Steps',
              sections: [],
              step_entries: stepEntries
            }
          ]
        }
      ]
    }
  ]
}

function createSections(mode) {
  if (mode === 'metadata') {
    return [
      {
        __typename: 'GenAIUnifiedResponseSection',
        view_model: {
          __typename: 'GenAISingleLayoutViewModel',
          primitive: {
            __typename: 'GenAIMetadataTextPrimitive',
            text: 'full step'
          }
        }
      }
    ]
  }

  return [
    {
      __typename: 'GenAIUnifiedResponseSection',
      view_model: {
        __typename: 'GenAISingleLayoutViewModel',
        primitive: {
          __typename: 'GenAIMarkdownTextUXPrimitive',
          text: ''
        }
      }
    },
    {
      __typename: 'GenAIUnifiedResponseSection',
      view_model: {
        __typename: 'GenAISingleLayoutViewModel',
        primitive: {
          __typename: 'GenAIBotProgressStatusPrimitive',
          title: 'full step',
          is_in_progress: true,
          icon: 'THINKING'
        }
      }
    }
  ]
}

export function createStepsPayload(mode = 'progress') {
  if (!['progress', 'metadata'].includes(mode)) {
    throw new TypeError(`Mode tidak valid: ${mode}. Gunakan progress atau metadata.`)
  }

  const stepEntries = createStepEntries()
  const unifiedResponse = {
    __typename: 'GenAIUnifiedResponse',
    response_id: RESPONSE_ID,
    sections: createSections(mode),
    embedded_screens: createEmbeddedScreens(stepEntries)
  }

  return {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(unifiedResponse)).toString('base64')
          },
          contextInfo: {
            forwardingScore: 3,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: BOT_JID
            },
            forwardOrigin: 4,
            botMessageSharingInfo: {
              botEntryPointOrigin: 1,
              forwardScore: 4
            }
          }
        }
      }
    }
  }
}

export async function sendSteps(conn, chat, mode = 'progress') {
  if (!conn || typeof conn.relayMessage !== 'function') {
    throw new TypeError('Koneksi ELYRINE tidak memiliki method relayMessage().')
  }
  if (typeof chat !== 'string' || !chat) {
    throw new TypeError('Chat ID tidak valid.')
  }

  return conn.relayMessage(chat, createStepsPayload(mode), {})
}
