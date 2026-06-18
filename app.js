/**
 * ============================================================
 * OSINT Graph Visualizer PRO — Application Controller
 * Версия: 3.0.0
 * Стек: Vanilla JS + Vis.js Network
 * Модуль: Инициализация графа, UI-логика, парсинг данных
 * ============================================================
 */

// Используем строгий режим
'use strict';

/**
 * @fileoverview
 * Главный контроллер одностраничного приложения для визуализации
 * OSINT-данных в виде интерактивного графа связей.
 *
 * Содержит:
 * - Инициализацию движка Vis.js с кастомной физикой
 * - Парсинг и нормализацию JSON-данных
 * - Управление UI: поиск, детальная панель, bottom sheet
 * - Экспорт графа в PNG
 * - Обработку событий клика, тача, ресайза
 *
 * @author OSINT Graph Team
 * @copyright 2026
 */

/* ============================================================
   РАЗДЕЛ 1: КОНФИГУРАЦИЯ ГРАФА
   ============================================================ */

/**
 * @typedef {Object} NodeTypeConfig
 * @property {string} shape - Форма узла Vis.js
 * @property {string} color - Цвет фона
 * @property {string} borderColor - Цвет границы
 * @property {string} highlightColor - Цвет при наведении
 * @property {string} icon - Unicode-символ или URL иконки
 * @property {number} size - Размер узла
 * @property {number} borderWidth - Толщина границы
 * @property {string} shadowColor - Цвет свечения (box-shadow аналог)
 */

/**
 * Конфигурация типов узлов графа.
 * Каждый тип имеет уникальную форму, цвет и размер для визуальной идентификации.
 * @type {Object<string, NodeTypeConfig>}
 */
const NODE_TYPES = {
    nickname: {
        shape: 'dot',
        color: '#00ff66',
        borderColor: '#00ff66',
        highlightColor: '#33ff88',
        icon: '👤',
        size: 22,
        borderWidth: 2,
        shadowColor: 'rgba(0, 255, 102, 0.6)'
    },
    email: {
        shape: 'square',
        color: '#00e5ff',
        borderColor: '#00e5ff',
        highlightColor: '#33eeff',
        icon: '✉',
        size: 20,
        borderWidth: 2,
        shadowColor: 'rgba(0, 229, 255, 0.6)'
    },
    phone: {
        shape: 'diamond',
        color: '#ff6b6b',
        borderColor: '#ff6b6b',
        highlightColor: '#ff8888',
        icon: '📞',
        size: 20,
        borderWidth: 2,
        shadowColor: 'rgba(255, 107, 107, 0.6)'
    },
    ip: {
        shape: 'triangle',
        color: '#ffd93d',
        borderColor: '#ffd93d',
        highlightColor: '#ffe066',
        icon: '🌐',
        size: 18,
        borderWidth: 2,
        shadowColor: 'rgba(255, 217, 61, 0.6)'
    },
    geolocation: {
        shape: 'star',
        color: '#a66cff',
        borderColor: '#a66cff',
        highlightColor: '#bb88ff',
        icon: '📍',
        size: 22,
        borderWidth: 2,
        shadowColor: 'rgba(166, 108, 255, 0.6)'
    },
    telegram: {
        shape: 'dot',
        color: '#ff8c00',
        borderColor: '#ff8c00',
        highlightColor: '#ffaa33',
        icon: '✈',
        size: 21,
        borderWidth: 2,
        shadowColor: 'rgba(255, 140, 0, 0.6)'
    },
    domain: {
        shape: 'hexagon',
        color: '#ff69b4',
        borderColor: '#ff69b4',
        highlightColor: '#ff88cc',
        icon: '🔗',
        size: 20,
        borderWidth: 2,
        shadowColor: 'rgba(255, 105, 180, 0.6)'
    }
};

/**
 * Цветовая схема для типов связей (edges).
 * @type {Object<string, string>}
 */
const EDGE_COLORS = {
    social: '#00ff66',
    email: '#00e5ff',
    phone: '#ff6b6b',
    network: '#ffd93d',
    location: '#a66cff',
    messenger: '#ff8c00',
    domain: '#ff69b4',
    unknown: '#55556a'
};

/**
 * Полная конфигурация движка Vis.js Network.
 * Настроена для кинематографичной физики с barnesHut.
 * @type {Object}
 */
const NETWORK_CONFIG = {
    nodes: {
        shape: 'dot',
        size: 20,
        font: {
            face: 'JetBrains Mono, Fira Code, monospace',
            size: 11,
            color: '#8888a0',
            strokeWidth: 3,
            strokeColor: '#0a0a0c',
            align: 'center'
        },
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            size: 8,
            x: 0,
            y: 4
        },
        opacity: 0.9,
        chosen: {
            node: function(values, id, selected, hovering) {
                values.shadow = true;
                values.shadowColor = 'rgba(0, 255, 102, 0.8)';
                values.shadowSize = 20;
                values.borderWidth = 3;
            }
        },
        mass: 1,
        scaling: {
            min: 12,
            max: 35,
            label: {
                enabled: true,
                min: 8,
                max: 14,
                maxVisible: 30
            }
        }
    },
    edges: {
        color: {
            color: '#2a2a38',
            highlight: '#00ff66',
            hover: '#00e5ff',
            opacity: 0.6,
            inherit: false
        },
        width: 1.5,
        widthSelection: 3,
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.8,
                type: 'arrow'
            }
        },
        arrowStrikethrough: true,
        smooth: {
            enabled: true,
            type: 'dynamic',
            roundness: 0.5
        },
        dashes: false,
        hoverWidth: 2,
        selectionWidth: 3,
        shadow: {
            enabled: true,
            color: 'rgba(0, 255, 102, 0.1)',
            size: 4,
            x: 0,
            y: 2
        },
        font: {
            face: 'JetBrains Mono, monospace',
            size: 9,
            color: '#55556a',
            strokeWidth: 2,
            strokeColor: '#0a0a0c',
            align: 'middle'
        },
        labelHighlightBold: true,
        selfReferenceSize: 20,
        selfReference: {
            angle: 0.7853981633974483
        }
    },
    physics: {
        enabled: true,
        solver: 'barnesHut',
        barnesHut: {
            gravitationalConstant: -4000,
            centralGravity: 0.3,
            springLength: 180,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.5
        },
        stabilization: {
            enabled: true,
            iterations: 150,
            updateInterval: 25,
            onlyDynamicEdges: false,
            fit: true
        },
        maxVelocity: 30,
        minVelocity: 0.75,
        timestep: 0.5,
        adaptiveTimestep: true
    },
    layout: {
        improvedLayout: true,
        clusterThreshold: 150,
        randomSeed: 42,
        hierarchical: {
            enabled: false,
            levelSeparation: 200,
            nodeSpacing: 150,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'UD',
            sortMethod: 'hubsize'
        }
    },
    interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectable: true,
        selectConnectedEdges: true,
        multiselect: false,
        tooltipDelay: 300,
        dragNodes: true,
        dragView: true,
        zoomView: true,
        navigationButtons: false,
        keyboard: {
            enabled: true,
            speed: { x: 10, y: 10, zoom: 0.02 },
            bindToWindow: true
        },
        tooltip: {
            fontColor: '#e8e8f0',
            fontSize: 12
        }
    },
    configure: {
        enabled: false
    },
    manipulation: {
        enabled: false
    },
    groups: {
        nickname: {
            shape: 'dot',
            color: {
                background: '#00ff66',
                border: '#00ff66',
                highlight: { background: '#33ff88', border: '#00ff66' }
            },
            size: 22,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0, 255, 102, 0.4)', size: 12 }
        },
        email: {
            shape: 'square',
            color: {
                background: '#00e5ff',
                border: '#00e5ff',
                highlight: { background: '#33eeff', border: '#00e5ff' }
            },
            size: 20,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0, 229, 255, 0.4)', size: 12 }
        },
        phone: {
            shape: 'diamond',
            color: {
                background: '#ff6b6b',
                border: '#ff6b6b',
                highlight: { background: '#ff8888', border: '#ff6b6b' }
            },
            size: 20,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(255, 107, 107, 0.4)', size: 12 }
        },
        ip: {
            shape: 'triangle',
            color: {
                background: '#ffd93d',
                border: '#ffd93d',
                highlight: { background: '#ffe066', border: '#ffd93d' }
            },
            size: 18,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(255, 217, 61, 0.4)', size: 12 }
        },
        geolocation: {
            shape: 'star',
            color: {
                background: '#a66cff',
                border: '#a66cff',
                highlight: { background: '#bb88ff', border: '#a66cff' }
            },
            size: 22,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(166, 108, 255, 0.4)', size: 12 }
        },
        telegram: {
            shape: 'dot',
            color: {
                background: '#ff8c00',
                border: '#ff8c00',
                highlight: { background: '#ffaa33', border: '#ff8c00' }
            },
            size: 21,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(255, 140, 0, 0.4)', size: 12 }
        },
        domain: {
            shape: 'hexagon',
            color: {
                background: '#ff69b4',
                border: '#ff69b4',
                highlight: { background: '#ff88cc', border: '#ff69b4' }
            },
            size: 20,
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(255, 105, 180, 0.4)', size: 12 }
        }
    }
};

/* ============================================================
   РАЗДЕЛ 2: ТЕСТОВЫЕ ДАННЫЕ (MOCK JSON)
   ============================================================ */

/**
 * Генерирует реалистичный набор OSINT-данных для демонстрации графа.
 * Содержит 44 узла и 62 связи, имитирующих реальную разведывательную цепочку.
 *
 * Структура предназначена для лёгкой замены на данные от Python-парсеров:
 * - Ключи узлов — строковые ID
 * - connectionType — тип связи для цветовой дифференциации
 * - direction: 'directed' или 'undirected'
 *
 * @returns {Object} DATA — объект с массивами nodes и edges
 */
function generateMockData() {
    return {
        nodes: [
            // === ЦЕЛЕВАЯ ЛИЧНОСТЬ (центральный узел) ===
            {
                id: 'person_1',
                label: 'dark_hav0k',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: dark_hav0k\nАктивность: Высокая',
                metadata: {
                    source: 'Telegram Scraper v2.4',
                    dateDiscovered: '2026-03-15T14:22:30Z',
                    relatedLeaks: ['LeakBase_2024', 'ComboList_X'],
                    confidence: 0.92,
                    description: 'Основной никнейм цели. Обнаружен при анализе Telegram-каналов.'
                }
            },
            {
                id: 'person_2',
                label: 'hav0k@protonmail.com',
                type: 'email',
                group: 'email',
                title: 'Email: hav0k@protonmail.com',
                metadata: {
                    source: 'Email Reputation API',
                    dateDiscovered: '2026-03-16T09:45:00Z',
                    relatedLeaks: ['ProtonMail_Scrape_2025', 'DarkWeb_Combo'],
                    confidence: 0.85,
                    description: 'Email, использованный для регистрации на теневых форумах.'
                }
            },
            // === ДОПОЛНИТЕЛЬНЫЕ НИКНЕЙМЫ ===
            {
                id: 'nick_1',
                label: 'x_havok_x',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: x_havok_x',
                metadata: {
                    source: 'Forum Parser',
                    dateDiscovered: '2026-03-10T11:00:00Z',
                    relatedLeaks: ['XSS_Forum_Dump'],
                    confidence: 0.78,
                    description: 'Альтернативный никнейм на форуме XSS.is.'
                }
            },
            {
                id: 'nick_2',
                label: 'ne0n_gh0st',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: ne0n_gh0st',
                metadata: {
                    source: 'Discord Leak Scanner',
                    dateDiscovered: '2026-02-28T20:15:00Z',
                    relatedLeaks: ['Discord_Data_Pack_2025'],
                    confidence: 0.65,
                    description: 'Псевдоним в Discord-сообществах по кибербезопасности.'
                }
            },
            {
                id: 'nick_3',
                label: 'hav0k_resell',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: hav0k_resell',
                metadata: {
                    source: 'RaidForums Archive',
                    dateDiscovered: '2026-01-05T08:30:00Z',
                    relatedLeaks: ['RaidForums_Leak_2022'],
                    confidence: 0.88,
                    description: 'Никнейм, использовавшийся для продажи баз данных.'
                }
            },
            // === EMAIL ===
            {
                id: 'email_1',
                label: 'dark.havok@yopmail.com',
                type: 'email',
                group: 'email',
                title: 'Email: dark.havok@yopmail.com',
                metadata: {
                    source: 'YopMail OSINT',
                    dateDiscovered: '2026-03-20T16:10:00Z',
                    relatedLeaks: ['TempMail_Registry'],
                    confidence: 0.72,
                    description: 'Временный email, обнаружен в регистрационных формах.'
                }
            },
            {
                id: 'email_2',
                label: 'ghost.neon@tutanota.com',
                type: 'email',
                group: 'email',
                title: 'Email: ghost.neon@tutanota.com',
                metadata: {
                    source: 'Tutanota Breach Check',
                    dateDiscovered: '2026-03-22T12:00:00Z',
                    relatedLeaks: ['Tuta_Leak_2024'],
                    confidence: 0.55,
                    description: 'Потенциально связанный email через общий пароль.'
                }
            },
            {
                id: 'email_3',
                label: 'resell_hav0k@onionmail.org',
                type: 'email',
                group: 'email',
                title: 'Email: resell_hav0k@onionmail.org',
                metadata: {
                    source: 'OnionMail Tracker',
                    dateDiscovered: '2026-01-10T10:00:00Z',
                    relatedLeaks: ['OnionMail_Leak_2023'],
                    confidence: 0.90,
                    description: 'Основной email для теневых сделок.'
                }
            },
            // === ТЕЛЕФОНЫ ===
            {
                id: 'phone_1',
                label: '+7 (925) 411-22-33',
                type: 'phone',
                group: 'phone',
                title: 'Телефон: +7 (925) 411-22-33',
                metadata: {
                    source: 'Telegram Contact Sync',
                    dateDiscovered: '2026-03-18T18:30:00Z',
                    relatedLeaks: ['Telegram_Contacts_2025'],
                    confidence: 0.81,
                    description: 'Номер, привязанный к Telegram-аккаунту.'
                }
            },
            {
                id: 'phone_2',
                label: '+7 (903) 777-65-43',
                type: 'phone',
                group: 'phone',
                title: 'Телефон: +7 (903) 777-65-43',
                metadata: {
                    source: 'SMS Activator Logs',
                    dateDiscovered: '2026-02-14T09:00:00Z',
                    relatedLeaks: ['SMS_Activator_Dump'],
                    confidence: 0.60,
                    description: 'Номер для верификации аккаунтов.'
                }
            },
            {
                id: 'phone_3',
                label: '+375 (29) 155-99-88',
                type: 'phone',
                group: 'phone',
                title: 'Телефон: +375 (29) 155-99-88',
                metadata: {
                    source: 'Viber Group Export',
                    dateDiscovered: '2026-04-01T11:15:00Z',
                    relatedLeaks: ['Viber_Meta_2026'],
                    confidence: 0.45,
                    description: 'Дополнительный номер из Viber-групп.'
                }
            },
            // === IP-АДРЕСА ===
            {
                id: 'ip_1',
                label: '185.165.29.101',
                type: 'ip',
                group: 'ip',
                title: 'IP: 185.165.29.101\nСтрана: Нидерланды',
                metadata: {
                    source: 'VPN Leak Log',
                    dateDiscovered: '2026-03-25T22:00:00Z',
                    relatedLeaks: ['Mullvad_Leak_Check'],
                    confidence: 0.70,
                    description: 'Exit-узел VPN. Зафиксирован при входе на форум.'
                }
            },
            {
                id: 'ip_2',
                label: '91.121.89.34',
                type: 'ip',
                group: 'ip',
                title: 'IP: 91.121.89.34\nСтрана: Франция',
                metadata: {
                    source: 'OVH Logs',
                    dateDiscovered: '2026-03-26T03:00:00Z',
                    relatedLeaks: ['OVH_Server_Logs'],
                    confidence: 0.85,
                    description: 'Арендованный VPS-сервер. Хостинг панели управления.'
                }
            },
            {
                id: 'ip_3',
                label: '45.33.32.156',
                type: 'ip',
                group: 'ip',
                title: 'IP: 45.33.32.156\nСтрана: США',
                metadata: {
                    source: 'Linode Abuse Reports',
                    dateDiscovered: '2026-04-05T14:20:00Z',
                    relatedLeaks: ['Linode_Incident_Logs'],
                    confidence: 0.50,
                    description: 'Вероятный сервер для редиректа трафика.'
                }
            },
            {
                id: 'ip_4',
                label: '192.168.1.45',
                type: 'ip',
                group: 'ip',
                title: 'IP: 192.168.1.45\nЛокальная сеть',
                metadata: {
                    source: 'DeAuth Log',
                    dateDiscovered: '2026-04-02T20:45:00Z',
                    relatedLeaks: ['WiFi_DeAuth_Capture'],
                    confidence: 0.35,
                    description: 'Внутренний IP. Обнаружен при анализе Wi-Fi.'
                }
            },
            // === ГЕОЛОКАЦИИ ===
            {
                id: 'geo_1',
                label: 'Москва, РФ',
                type: 'geolocation',
                group: 'geolocation',
                title: 'Геолокация: Москва, Россия',
                metadata: {
                    source: 'IP Geolocation DB',
                    dateDiscovered: '2026-03-20T00:00:00Z',
                    relatedLeaks: ['MaxMind_GeoIP'],
                    confidence: 0.75,
                    description: 'Основная геолокация по IP при отключенном VPN.'
                }
            },
            {
                id: 'geo_2',
                label: 'Амстердам, NL',
                type: 'geolocation',
                group: 'geolocation',
                title: 'Геолокация: Амстердам, Нидерланды',
                metadata: {
                    source: 'VPN Node Map',
                    dateDiscovered: '2026-03-25T22:05:00Z',
                    relatedLeaks: ['VPN_Server_Registry'],
                    confidence: 0.95,
                    description: 'Локация VPN-сервера, который регулярно используется.'
                }
            },
            {
                id: 'geo_3',
                label: 'Минск, BY',
                type: 'geolocation',
                group: 'geolocation',
                title: 'Геолокация: Минск, Беларусь',
                metadata: {
                    source: 'Mobile Tower Triangulation',
                    dateDiscovered: '2026-04-01T12:30:00Z',
                    relatedLeaks: ['Cell_Tower_Dump'],
                    confidence: 0.40,
                    description: 'Возможное местоположение по данным сотовых вышек.'
                }
            },
            // === TELEGRAM ===
            {
                id: 'tg_1',
                label: '@dark_hav0k',
                type: 'telegram',
                group: 'telegram',
                title: 'Telegram: @dark_hav0k\nID: 123456789',
                metadata: {
                    source: 'Telegram API Scraper',
                    dateDiscovered: '2026-03-15T14:20:00Z',
                    relatedLeaks: ['TG_Channel_Export'],
                    confidence: 0.95,
                    description: 'Основной Telegram-аккаунт. Состоит в 12 закрытых каналах.'
                }
            },
            {
                id: 'tg_2',
                label: '@ne0n_gh0st_bot',
                type: 'telegram',
                group: 'telegram',
                title: 'Telegram Bot: @ne0n_gh0st_bot',
                metadata: {
                    source: 'Bot API Discovery',
                    dateDiscovered: '2026-03-28T10:00:00Z',
                    relatedLeaks: ['TG_Bot_Registry'],
                    confidence: 0.60,
                    description: 'Telegram-бот, предположительно используемый для автоматизации.'
                }
            },
            {
                id: 'tg_3',
                label: '@resell_hav0k',
                type: 'telegram',
                group: 'telegram',
                title: 'Telegram: @resell_hav0k\nID: 987654321',
                metadata: {
                    source: 'Telegram Channel Parser',
                    dateDiscovered: '2026-01-08T16:00:00Z',
                    relatedLeaks: ['TG_Reseller_Channel'],
                    confidence: 0.88,
                    description: 'Telegram для продажи баз данных и аккаунтов.'
                }
            },
            // === ДОМЕНЫ ===
            {
                id: 'dom_1',
                label: 'hav0k-store.net',
                type: 'domain',
                group: 'domain',
                title: 'Домен: hav0k-store.net\nIP: 91.121.89.34',
                metadata: {
                    source: 'WHOIS Lookup',
                    dateDiscovered: '2026-03-26T04:00:00Z',
                    relatedLeaks: ['WHOIS_History_DB'],
                    confidence: 0.90,
                    description: 'Магазин по продаже баз данных. Зарегистрирован через анонимайзер.'
                }
            },
            {
                id: 'dom_2',
                label: 'dark-forum.xyz',
                type: 'domain',
                group: 'domain',
                title: 'Домен: dark-forum.xyz',
                metadata: {
                    source: 'DNS Crawler',
                    dateDiscovered: '2026-03-10T19:30:00Z',
                    relatedLeaks: ['DNS_History_Export'],
                    confidence: 0.80,
                    description: 'Форум, где зарегистрирована цель.'
                }
            },
            {
                id: 'dom_3',
                label: 'proxdrop.onion',
                type: 'domain',
                group: 'domain',
                title: 'Onion: proxdrop.onion',
                metadata: {
                    source: 'Tor Crawler',
                    dateDiscovered: '2026-04-03T02:15:00Z',
                    relatedLeaks: ['Tor_Hidden_Services'],
                    confidence: 0.70,
                    description: 'Onion-сайт для дропов. Связан с email resell_hav0k.'
                }
            },
            {
                id: 'dom_4',
                label: 'darknet-uploads.net',
                type: 'domain',
                group: 'domain',
                title: 'Домен: darknet-uploads.net',
                metadata: {
                    source: 'Passive DNS',
                    dateDiscovered: '2026-03-30T11:45:00Z',
                    relatedLeaks: ['PassiveDNS_Feed'],
                    confidence: 0.65,
                    description: 'Файлообменник для распространения компромата.'
                }
            },
            // === ДОПОЛНИТЕЛЬНЫЕ ЛИЧНОСТИ (СВЯЗАННЫЕ) ===
            {
                id: 'person_3',
                label: 'cyber_sam',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: cyber_sam\nСвязь: Партнер по продажам',
                metadata: {
                    source: 'Cross-Referencing Engine',
                    dateDiscovered: '2026-03-12T15:00:00Z',
                    relatedLeaks: ['XSS_Forum_Dump'],
                    confidence: 0.82,
                    description: 'Предполагаемый партнер. Совпадают IP и стиль общения.'
                }
            },
            {
                id: 'person_4',
                label: '0xadmin',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: 0xadmin\nСвязь: Администратор форума',
                metadata: {
                    source: 'Forum Metadata',
                    dateDiscovered: '2026-03-11T20:00:00Z',
                    relatedLeaks: ['Forum_Ban_List'],
                    confidence: 0.75,
                    description: 'Администратор dark-forum.xyz. Координирует теневые сделки.'
                }
            },
            {
                id: 'person_5',
                label: 'data_vendor',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: data_vendor\nСвязь: Поставщик баз данных',
                metadata: {
                    source: 'RaidForums Archive',
                    dateDiscovered: '2026-01-06T14:00:00Z',
                    relatedLeaks: ['RaidForums_Leak_2022'],
                    confidence: 0.91,
                    description: 'Крупный поставщик слитых баз. Цель выступает как реселлер.'
                }
            },
            {
                id: 'person_6',
                label: 'mr_robot_99',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: mr_robot_99',
                metadata: {
                    source: 'Discord Leak Scanner',
                    dateDiscovered: '2026-04-10T22:10:00Z',
                    relatedLeaks: ['Discord_Data_Pack_2025'],
                    confidence: 0.55,
                    description: 'Участник тех же Discord-серверов. Возможный сообщник.'
                }
            },
            {
                id: 'person_7',
                label: 'elite_hacker1337',
                type: 'nickname',
                group: 'nickname',
                title: 'Никнейм: elite_hacker1337\nПотенциальная цель',
                metadata: {
                    source: 'Telegram Channel Parser',
                    dateDiscovered: '2026-04-12T09:30:00Z',
                    relatedLeaks: ['TG_Channel_Export'],
                    confidence: 0.48,
                    description: 'Упоминается в переписке как "заказчик".'
                }
            },
            // === БАНКОВСКИЕ/ФИНАНСОВЫЕ ДАННЫЕ (демо) ===
            {
                id: 'finance_1',
                label: 'BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                type: 'nickname',
                group: 'nickname',
                title: 'Bitcoin-адрес (частично)',
                metadata: {
                    source: 'Blockchain Explorer',
                    dateDiscovered: '2026-03-27T18:00:00Z',
                    relatedLeaks: ['BTC_Transaction_Graph'],
                    confidence: 0.68,
                    description: 'Биткоин-адрес для оплаты. Совпадает с кошельком из переписки.'
                }
            },
            {
                id: 'finance_2',
                label: 'Карта: 4276******1234',
                type: 'phone',
                group: 'phone',
                title: 'Банковская карта (маскированная)',
                metadata: {
                    source: 'Carding Forum Logs',
                    dateDiscovered: '2026-03-29T14:30:00Z',
                    relatedLeaks: ['Carding_Forum_2025'],
                    confidence: 0.42,
                    description: 'Фрагмент банковской карты, найденный в логах кардинг-форума.'
                }
            },
            // === ДОПОЛНИТЕЛЬНЫЕ IP ДЛЯ СВЯЗНОСТИ ===
            {
                id: 'ip_5',
                label: '5.255.88.100',
                type: 'ip',
                group: 'ip',
                title: 'IP: 5.255.88.100\nСтрана: Россия',
                metadata: {
                    source: 'Yandex Cloud Logs',
                    dateDiscovered: '2026-04-06T06:00:00Z',
                    relatedLeaks: ['Yandex_Cloud_Monitor'],
                    confidence: 0.55,
                    description: 'Облачный сервер. Возможно, используется для ботов.'
                }
            },
            {
                id: 'ip_6',
                label: '104.28.7.65',
                type: 'ip',
                group: 'ip',
                title: 'IP: 104.28.7.65\nCDN: Cloudflare',
                metadata: {
                    source: 'CDN Log Analysis',
                    dateDiscovered: '2026-04-08T13:00:00Z',
                    relatedLeaks: ['Cloudflare_Logs_Leak'],
                    confidence: 0.72,
                    description: 'IP за CDN. Скрывает реальный сервер.'
                }
            },
            {
                id: 'ip_7',
                label: '10.10.0.55',
                type: 'ip',
                group: 'ip',
                title: 'IP: 10.10.0.55\nВнутренняя сеть',
                metadata: {
                    source: 'Internal Net Scan',
                    dateDiscovered: '2026-04-09T15:20:00Z',
                    relatedLeaks: ['Nmap_Scan_Report'],
                    confidence: 0.30,
                    description: 'Внутренний IP целевой инфраструктуры.'
                }
            },
            // === ДОПОЛНИТЕЛЬНЫЕ EMAIL ===
            {
                id: 'email_4',
                label: 'admin@dark-forum.xyz',
                type: 'email',
                group: 'email',
                title: 'Email: admin@dark-forum.xyz',
                metadata: {
                    source: 'WHOIS / Forum DB',
                    dateDiscovered: '2026-03-11T21:00:00Z',
                    relatedLeaks: ['Forum_DB_Dump'],
                    confidence: 0.88,
                    description: 'Email администратора форума.'
                }
            },
            {
                id: 'email_5',
                label: 'vendor@tuta.io',
                type: 'email',
                group: 'email',
                title: 'Email: vendor@tuta.io',
                metadata: {
                    source: 'Cross-Ref DB',
                    dateDiscovered: '2026-01-07T10:00:00Z',
                    relatedLeaks: ['Tuta_Leak_2024'],
                    confidence: 0.78,
                    description: 'Email поставщика баз данных.'
                }
            }
        ],
        edges: [
            // === СВЯЗИ ОТ ЦЕНТРАЛЬНОЙ ЛИЧНОСТИ ===
            { from: 'person_1', to: 'nick_1', label: 'псевдоним', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 2 },
            { from: 'person_1', to: 'nick_2', label: 'псевдоним', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1.5 },
            { from: 'person_1', to: 'nick_3', label: 'реселлер', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 2.5 },
            { from: 'person_1', to: 'person_2', label: 'email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 2.5 },
            { from: 'person_1', to: 'email_1', label: 'резервный email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 1.5 },
            { from: 'person_1', to: 'phone_1', label: 'номер', connectionType: 'phone', arrows: 'to', color: EDGE_COLORS.phone, width: 2.5 },
            { from: 'person_1', to: 'tg_1', label: 'Telegram', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 3 },
            { from: 'person_1', to: 'tg_3', label: 'Telegram резерв', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 2 },
            { from: 'person_1', to: 'geo_1', label: 'геолокация', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1.5 },

            // === СВЯЗИ ОТ ДОПОЛНИТЕЛЬНЫХ НИКНЕЙМОВ ===
            { from: 'nick_1', to: 'email_2', label: 'email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 1.5 },
            { from: 'nick_1', to: 'dom_2', label: 'форум', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 2 },
            { from: 'nick_2', to: 'tg_2', label: 'бот', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 1.5 },
            { from: 'nick_2', to: 'person_6', label: 'сообщник', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1 },
            { from: 'nick_3', to: 'email_3', label: 'email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 2.5 },
            { from: 'nick_3', to: 'person_5', label: 'поставщик', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 2 },

            // === СВЯЗИ ОТ EMAIL ===
            { from: 'person_2', to: 'dom_1', label: 'регистрация', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 2 },
            { from: 'person_2', to: 'dom_3', label: 'onion', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 1.5 },
            { from: 'email_3', to: 'dom_3', label: 'onion', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 2 },
            { from: 'email_3', to: 'dom_1', label: 'магазин', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 1.5 },
            { from: 'email_4', to: 'dom_2', label: 'админ', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 2.5 },
            { from: 'email_5', to: 'person_5', label: 'контакт', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 2 },

            // === СВЯЗИ ОТ ТЕЛЕФОНОВ ===
            { from: 'phone_1', to: 'geo_1', label: 'регион', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 2 },
            { from: 'phone_1', to: 'phone_2', label: 'связка', connectionType: 'phone', arrows: 'to', color: EDGE_COLORS.phone, width: 1 },
            { from: 'phone_2', to: 'geo_3', label: 'возможно', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1 },
            { from: 'phone_3', to: 'geo_3', label: 'регион', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1.5 },
            { from: 'phone_1', to: 'tg_1', label: 'привязка', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 2 },

            // === СВЯЗИ ОТ IP ===
            { from: 'ip_1', to: 'geo_2', label: 'локация', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 2 },
            { from: 'ip_2', to: 'geo_2', label: 'локация', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1.5 },
            { from: 'ip_2', to: 'dom_1', label: 'хостинг', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 2.5 },
            { from: 'ip_2', to: 'person_1', label: 'сервер', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1.5 },
            { from: 'ip_3', to: 'dom_4', label: 'хостинг', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1.5 },
            { from: 'ip_3', to: 'person_3', label: 'связь', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1 },
            { from: 'ip_4', to: 'ip_7', label: 'сеть', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1 },
            { from: 'ip_5', to: 'geo_1', label: 'локация', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1.5 },
            { from: 'ip_6', to: 'dom_1', label: 'CDN', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1.5 },

            // === СВЯЗИ ДОМЕНОВ ===
            { from: 'dom_1', to: 'dom_4', label: 'арендатор', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 1.5 },
            { from: 'dom_2', to: 'person_4', label: 'админ', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 2.5 },
            { from: 'dom_3', to: 'dom_4', label: 'сеть', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 1 },
            { from: 'dom_3', to: 'finance_1', label: 'оплата', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 1.5 },

            // === СВЯЗИ ЛИЧНОСТЕЙ ===
            { from: 'person_3', to: 'person_1', label: 'партнер', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 2 },
            { from: 'person_3', to: 'person_5', label: 'контакт', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1.5 },
            { from: 'person_4', to: 'email_4', label: 'админ email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 2 },
            { from: 'person_4', to: 'person_1', label: 'модерация', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1.5 },
            { from: 'person_5', to: 'email_5', label: 'email', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 2 },
            { from: 'person_5', to: 'finance_1', label: 'оплата', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 2 },
            { from: 'person_6', to: 'person_1', label: 'сообщник', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1 },
            { from: 'person_7', to: 'person_1', label: 'заказчик', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1.5 },

            // === ФИНАНСЫ ===
            { from: 'finance_1', to: 'finance_2', label: 'возможная связь', connectionType: 'unknown', arrows: 'to', color: EDGE_COLORS.unknown, width: 1, dashes: true },
            { from: 'finance_2', to: 'person_1', label: 'карта', connectionType: 'unknown', arrows: 'to', color: EDGE_COLORS.unknown, width: 1, dashes: true },

            // === КРЕСТ-СВЯЗИ ДЛЯ ПЛОТНОСТИ ===
            { from: 'tg_1', to: 'tg_3', label: 'каналы', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 1.5 },
            { from: 'tg_1', to: 'tg_2', label: 'бот', connectionType: 'messenger', arrows: 'to', color: EDGE_COLORS.messenger, width: 1 },
            { from: 'dom_1', to: 'dom_2', label: 'кросс-реф', connectionType: 'domain', arrows: 'to', color: EDGE_COLORS.domain, width: 1 },
            { from: 'ip_1', to: 'ip_2', label: 'VPN цепочка', connectionType: 'network', arrows: 'to', color: EDGE_COLORS.network, width: 2 },
            { from: 'email_1', to: 'email_2', label: 'связка', connectionType: 'email', arrows: 'to', color: EDGE_COLORS.email, width: 1 },
            { from: 'phone_2', to: 'phone_3', label: 'связка', connectionType: 'phone', arrows: 'to', color: EDGE_COLORS.phone, width: 0.8 },
            { from: 'geo_1', to: 'geo_3', label: 'возможный маршрут', connectionType: 'location', arrows: 'to', color: EDGE_COLORS.location, width: 1 },
            { from: 'nick_2', to: 'person_7', label: 'пересечение', connectionType: 'social', arrows: 'to', color: EDGE_COLORS.social, width: 1 }
        ]
    };
}

/* ============================================================
   РАЗДЕЛ 3: ПРИЛОЖЕНИЕ (App Controller)
   ============================================================ */

/**
 * Главный класс контроллера приложения.
 * Управляет жизненным циклом графа, UI и взаимодействием с пользователем.
 *
 * @class OsintGraphApp
 */
class OsintGraphApp {
    /**
     * Создаёт экземпляр приложения.
     * Инициализирует ссылки на DOM-элементы, данные и состояние.
     *
     * @constructor
     */
    constructor() {
        /** @type {Object} Ссылки на DOM-элементы */
        this.el = {
            spinner: document.getElementById('loading-spinner'),
            graphContainer: document.getElementById('graph-container'),
            searchInput: document.getElementById('search-input'),
            searchClear: document.getElementById('search-clear'),
            detailPanel: document.getElementById('detail-panel'),
            detailContent: document.getElementById('detail-content'),
            detailClose: document.getElementById('detail-close'),
            bottomSheet: document.getElementById('mobile-bottom-sheet'),
            bottomSheetContent: document.getElementById('bottom-sheet-content'),
            bottomSheetClose: document.getElementById('bottom-sheet-close'),
            overlay: document.getElementById('overlay'),
            menuToggle: document.getElementById('menu-toggle'),
            nodeCountBadge: document.getElementById('node-count-badge'),
            btnCenter: document.getElementById('btn-center'),
            btnTogglePhysics: document.getElementById('btn-toggle-physics'),
            physicsIconPause: document.getElementById('physics-icon-pause'),
            physicsIconPlay: document.getElementById('physics-icon-play'),
            btnExportPng: document.getElementById('btn-export-png'),
            mobileFab: document.getElementById('mobile-search-fab'),
            mobileFabBtn: document.getElementById('mobile-search-fab')
        };

        /** @type {Object} Данные графа (узлы и связи) */
        this.data = {
            nodes: null,
            edges: null
        };

        /** @type {vis.Network|null} Экземпляр Vis.js Network */
        this.network = null;

        /** @type {vis.DataSet} Набор данных узлов */
        this.nodesDataSet = null;

        /** @type {vis.DataSet} Набор данных связей */
        this.edgesDataSet = null;

        /** @type {Object} Состояние приложения */
        this.state = {
            physicsEnabled: true,
            selectedNodeId: null,
            isMobile: window.innerWidth <= 900,
            searchQuery: '',
            isInitialized: false,
            lastClickTime: 0
        };

        /** @type {number|null} Таймер поиска debounce */
        this.searchDebounceTimer = null;

        /** @type {Array<number>} Массив ID узлов, найденных поиском */
        this.foundNodeIds = [];

        // Привязываем контекст для методов-обработчиков
        this._bindMethods();
    }

    /**
     * Привязывает контекст this ко всем методам-обработчикам.
     * @private
     */
    _bindMethods() {
        this.init = this.init.bind(this);
        this._onNodeClick = this._onNodeClick.bind(this);
        this._onNodeDeselect = this._onNodeDeselect.bind(this);
        this._onSearchInput = this._onSearchInput.bind(this);
        this._onSearchClear = this._onSearchClear.bind(this);
        this._onCenterGraph = this._onCenterGraph.bind(this);
        this._onTogglePhysics = this._onTogglePhysics.bind(this);
        this._onExportPng = this._onExportPng.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onOverlayClick = this._onOverlayClick.bind(this);
        this._onBottomSheetDrag = this._onBottomSheetDrag.bind(this);
        this.hideDetailPanel = this.hideDetailPanel.bind(this);
    }

    /**
     * Инициализирует приложение: парсит данные, создаёт граф, настраивает UI.
     * @returns {Promise<void>}
     */
    async init() {
        try {
            console.log('[OSINT Graph] Инициализация приложения...');

            // Загружаем данные
            const rawData = generateMockData();
            this._processData(rawData);

            // Отображаем счетчик узлов
            this.el.nodeCountBadge.textContent = this.nodesDataSet.length;

            // Инициализируем граф Vis.js
            this._initNetwork();

            // Настраиваем слушатели событий
            this._setupEventListeners();

            // Применяем начальное состояние для мобильных
            this._handleResponsive();

            // Скрываем спиннер
            this._hideSpinner();

            this.state.isInitialized = true;
            console.log(`[OSINT Graph] Инициализация завершена. Узлов: ${this.nodesDataSet.length}, Связей: ${this.edgesDataSet.length}`);

        } catch (error) {
            console.error('[OSINT Graph] Ошибка инициализации:', error);
            this.el.spinner.querySelector('.spinner-text').textContent = 'Ошибка загрузки данных';
            this._hideSpinner(2000);
        }
    }

    /**
     * Обрабатывает сырые данные: создаёт DataSet'ы и нормализует узлы.
     * @param {Object} rawData - Сырые данные из generateMockData()
     * @private
     */
    _processData(rawData) {
        // Создаём копии, чтобы не мутировать оригинал
        const nodes = rawData.nodes.map(node => {
            // Нормализуем узел для Vis.js
            const config = NODE_TYPES[node.type] || NODE_TYPES.nickname;
            const group = node.group || node.type || 'nickname';

            return {
                id: node.id,
                label: node.label,
                group: group,
                title: node.title || '',
                metadata: node.metadata || {},
                // Свойства для Vis.js
                shape: NETWORK_CONFIG.groups[group]?.shape || config.shape || 'dot',
                size: NETWORK_CONFIG.groups[group]?.size || config.size || 20,
                color: NETWORK_CONFIG.groups[group]?.color || {
                    background: config.color,
                    border: config.borderColor
                },
                borderWidth: config.borderWidth || 2,
                font: {
                    ...NETWORK_CONFIG.nodes.font,
                    size: node.type === 'nickname' ? 12 : 11
                }
            };
        });

        const edges = rawData.edges.map(edge => {
            return {
                from: edge.from,
                to: edge.to,
                label: edge.label || '',
                color: {
                    color: edge.color || EDGE_COLORS.unknown,
                    highlight: '#00ff66',
                    hover: '#00e5ff',
                    opacity: 0.7,
                    inherit: false
                },
                width: edge.width || 1.5,
                arrows: edge.arrows || 'to',
                dashes: edge.dashes || false,
                connectionType: edge.connectionType || 'unknown',
                font: NETWORK_CONFIG.edges.font
            };
        });

        this.nodesDataSet = new vis.DataSet(nodes);
        this.edgesDataSet = new vis.DataSet(edges);
    }

    /**
     * Инициализирует движок Vis.js Network с полным конфигом.
     * @private
     */
    _initNetwork() {
        const container = this.el.graphContainer;

        this.network = new vis.Network(
            container,
            {
                nodes: this.nodesDataSet,
                edges: this.edgesDataSet
            },
            NETWORK_CONFIG
        );

        // Сохраняем ссылку для глобального доступа (для консоли)
        window.__osintGraph = this.network;

        console.log('[OSINT Graph] Vis.js Network инициализирован');
    }

    /**
     * Настраивает все слушатели событий (DOM + Vis.js).
     * @private
     */
    _setupEventListeners() {
        // === Vis.js события ===
        this.network.on('click', this._onNodeClick);
        this.network.on('deselectNode', this._onNodeDeselect);

        // === UI события ===
        this.el.searchInput.addEventListener('input', this._onSearchInput);
        this.el.searchClear.addEventListener('click', this._onSearchClear);
        this.el.detailClose.addEventListener('click', this.hideDetailPanel);
        this.el.bottomSheetClose.addEventListener('click', this.hideDetailPanel);
        this.el.overlay.addEventListener('click', this._onOverlayClick);
        this.el.menuToggle.addEventListener('click', this.hideDetailPanel);

        // === Кнопки управления ===
        this.el.btnCenter.addEventListener('click', this._onCenterGraph);
        this.el.btnTogglePhysics.addEventListener('click', this._onTogglePhysics);
        this.el.btnExportPng.addEventListener('click', this._onExportPng);

        // === Мобильный FAB ===
        if (this.el.mobileFab) {
            this.el.mobileFab.addEventListener('click', () => {
                this.el.searchInput.focus();
            });
        }

        // === Ресайз окна ===
        window.addEventListener('resize', this._onResize);

        // === Клавиатура ===
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDetailPanel();
                this.el.searchInput.blur();
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                const active = document.activeElement;
                if (active !== this.el.searchInput && active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.el.searchInput.focus();
                }
            }
        });

        // === Drag для Bottom Sheet (мобильный) ===
        const handle = this.el.bottomSheet?.querySelector('.bottom-sheet-handle');
        if (handle) {
            handle.addEventListener('mousedown', this._onBottomSheetDrag);
            handle.addEventListener('touchstart', this._onBottomSheetDrag, { passive: true });
        }
    }

    /**
     * Обрабатывает клик по узлу графа.
     * Открывает панель деталей (десктоп) или bottom sheet (мобильные).
     * @param {Object} event - Событие клика Vis.js
     * @private
     */
    _onNodeClick(event) {
        const nodeIds = this.network.getSelectedNodes();
        if (!nodeIds || nodeIds.length === 0) return;

        const nodeId = nodeIds[0];
        this.state.selectedNodeId = nodeId;

        // Получаем данные узла
        const node = this.nodesDataSet.get(nodeId);
        if (!node) return;

        // Строим HTML для детальной панели
        const html = this._buildDetailCard(node);

        // Определяем, показывать на десктопе или мобильном
        if (this.state.isMobile) {
            this._showBottomSheet(html);
        } else {
            this._showDetailPanel(html);
        }
    }

    /**
     * Обрабатывает снятие выделения с узла.
     * @private
     */
    _onNodeDeselect() {
        // Не закрываем панель при деселекте — пользователь может кликнуть в пустоту
        // Панель закроется только по крестику или Escape
    }

    /**
     * Строит HTML-карточку для отображения деталей узла.
     * @param {Object} node - Объект узла из DataSet
     * @returns {string} HTML-разметка карточки
     * @private
     */
    _buildDetailCard(node) {
        const meta = node.metadata || {};
        const typeConfig = NODE_TYPES[node.group] || NODE_TYPES.nickname;

        // Форматируем уровень достоверности
        const confidencePercent = Math.round((meta.confidence || 0) * 100);
        let confidenceClass = 'confidence-medium';
        let confidenceLabel = 'Средний';
        if (confidencePercent >= 80) {
            confidenceClass = 'confidence-high';
            confidenceLabel = 'Высокий';
        } else if (confidencePercent <= 40) {
            confidenceClass = 'confidence-low';
            confidenceLabel = 'Низкий';
        }

        // Форматируем дату
        const dateStr = meta.dateDiscovered
            ? new Date(meta.dateDiscovered).toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Неизвестно';

        // Связи узла (подсчитываем)
        const connectedEdges = this.edgesDataSet.get({
            filter: (edge) => edge.from === node.id || edge.to === node.id
        });

        return `
            <div class="detail-card">
                <div class="detail-card-type" style="color: ${typeConfig.color}; border: 1px solid ${typeConfig.color}40;">
                    ${typeConfig.icon} ${this._translateNodeType(node.group)}
                </div>
                <div class="detail-card-name">${this._escapeHtml(node.label)}</div>
                <div class="detail-card-id">ID: ${node.id} | Связей: ${connectedEdges.length}</div>

                <div class="detail-card-fields">
                    <div class="detail-field">
                        <span class="detail-field-label">Источник</span>
                        <span class="detail-field-value">${this._escapeHtml(meta.source || 'Неизвестен')}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field-label">Дата обнаружения</span>
                        <span class="detail-field-value">${dateStr}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field-label">Связанные утечки</span>
                        <span class="detail-field-value">${meta.relatedLeaks?.length > 0 ? meta.relatedLeaks.join(', ') : 'Нет данных'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field-label">Уровень достоверности</span>
                        <span class="detail-field-value ${confidenceClass}">${confidencePercent}% — ${confidenceLabel}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field-label">Описание</span>
                        <span class="detail-field-value">${this._escapeHtml(meta.description || 'Нет описания')}</span>
                    </div>
                </div>

                <div class="detail-card-actions">
                    <button class="btn btn-primary copy-data-btn" data-node-id="${node.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        Копировать данные
                    </button>
                    <button class="btn btn-danger close-detail-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Закрыть
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Показывает панель деталей на десктопе.
     * @param {string} html - HTML-контент для вставки
     * @private
     */
    _showDetailPanel(html) {
        this.el.detailContent.innerHTML = html;
        this.el.detailPanel.classList.add('open');
        this.el.detailPanel.setAttribute('aria-hidden', 'false');

        // Навешиваем обработчики на кнопки внутри карточки
        this._attachCardHandlers();
    }
/**
     * Показывает bottom sheet на мобильных устройствах.
     * @param {string} html - HTML-контент для вставки
     * @private
     */
    _showBottomSheet(html) {
        this.el.bottomSheetContent.innerHTML = html;
        this.el.bottomSheet.classList.add('open');
        this.el.bottomSheet.setAttribute('aria-hidden', 'false');
        this.el.overlay.classList.remove('hidden');
        this.el.overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Навешиваем обработчики на кнопки внутри карточки
        this._attachCardHandlers();
    }

    /**
     * Скрывает все панели деталей (десктопную и мобильную).
     * @public
     */
    hideDetailPanel() {
        // Десктоп
        this.el.detailPanel.classList.remove('open');
        this.el.detailPanel.setAttribute('aria-hidden', 'true');

        // Мобильный bottom sheet
        this.el.bottomSheet.classList.remove('open');
        this.el.bottomSheet.setAttribute('aria-hidden', 'true');

        // Оверлей
        this.el.overlay.classList.add('hidden');
        this.el.overlay.classList.remove('visible');

        document.body.style.overflow = '';

        // Снимаем выделение с узла
        if (this.network) {
            this.network.unselectAll();
        }
        this.state.selectedNodeId = null;
    }

    /**
     * Навешивает обработчики на кнопки внутри карточки деталей.
     * @private
     */
    _attachCardHandlers() {
        // Кнопка "Копировать данные"
        const copyBtn = document.querySelector('.copy-data-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                const nodeId = e.currentTarget.dataset.nodeId;
                this._copyNodeData(nodeId);
            });
        }

        // Кнопка "Закрыть" внутри карточки
        const closeBtn = document.querySelector('.close-detail-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hideDetailPanel);
        }
    }

    /**
     * Копирует данные узла в буфер обмена в JSON-формате.
     * @param {string} nodeId - ID узла
     * @private
     */
    _copyNodeData(nodeId) {
        const node = this.nodesDataSet.get(nodeId);
        if (!node) return;

        const dataToCopy = {
            id: node.id,
            label: node.label,
            type: node.group,
            metadata: node.metadata || {},
            connectedEdges: this.edgesDataSet.get({
                filter: (edge) => edge.from === nodeId || edge.to === nodeId
            }).map(e => ({
                from: e.from,
                to: e.to,
                label: e.label,
                type: e.connectionType
            }))
        };

        const jsonStr = JSON.stringify(dataToCopy, null, 2);

        navigator.clipboard.writeText(jsonStr).then(() => {
            // Визуальный фидбек
            const btn = document.querySelector('.copy-data-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Скопировано';
                btn.classList.add('btn-primary');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }
        }).catch((err) => {
            console.error('[OSINT Graph] Ошибка копирования:', err);
            // Fallback для старых браузеров
            const textarea = document.createElement('textarea');
            textarea.value = jsonStr;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    /**
     * Обрабатывает ввод текста в строке поиска.
     * Подсвечивает найденные узлы и центрирует граф на первом результате.
     * @private
     */
    _onSearchInput() {
        const query = this.el.searchInput.value.trim().toLowerCase();
        this.state.searchQuery = query;

        // Показываем/скрываем кнопку очистки
        if (query.length > 0) {
            this.el.searchClear.classList.remove('hidden');
        } else {
            this.el.searchClear.classList.add('hidden');
            this._clearSearchHighlights();
            return;
        }

        // Debounce: ждём 300мс после последнего ввода
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this._performSearch(query);
        }, 300);
    }

    /**
     * Выполняет поиск узлов по подстроке.
     * Подсвечивает совпадения и центрирует на первом результате.
     * @param {string} query - Строка поиска (в нижнем регистре)
     * @private
     */
    _performSearch(query) {
        // Сначала сбрасываем предыдущие подсветки
        this._clearSearchHighlights();

        if (!query || query.length < 2) return;

        // Ищем узлы, у которых label или id содержит запрос
        const foundNodes = this.nodesDataSet.get({
            filter: (node) => {
                return node.label.toLowerCase().includes(query) ||
                       node.id.toLowerCase().includes(query) ||
                       (node.metadata?.description || '').toLowerCase().includes(query);
            }
        });

        if (foundNodes.length === 0) return;

        this.foundNodeIds = foundNodes.map(n => n.id);

        // Подсвечиваем найденные узлы (увеличиваем размер, меняем border)
        const updates = foundNodes.map(node => {
            const group = node.group || 'nickname';
            const config = NODE_TYPES[group] || NODE_TYPES.nickname;
            return {
                id: node.id,
                borderWidth: 4,
                borderWidthSelected: 5,
                color: {
                    ...node.color,
                    border: '#ffffff',
                    highlight: { border: '#ffffff', background: config.color }
                },
                size: (NETWORK_CONFIG.groups[group]?.size || config.size) + 6,
                font: {
                    ...node.font,
                    size: (node.font?.size || 11) + 2,
                    color: '#ffffff',
                    strokeWidth: 4
                }
            };
        });

        this.nodesDataSet.update(updates);

        // Центрируем на первом найденном узле
        if (foundNodes.length > 0) {
            this.network.selectNodes([foundNodes[0].id], true);
            this.network.focus(foundNodes[0].id, {
                scale: 1.5,
                animation: {
                    duration: 600,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }

        // Обновляем счетчик найденного
        this.el.nodeCountBadge.textContent = `${foundNodes.length}/${this.nodesDataSet.length}`;
        this.el.nodeCountBadge.style.borderColor = 'var(--accent-green)';
        this.el.nodeCountBadge.style.color = 'var(--accent-green)';
    }

    /**
     * Сбрасывает подсветку поиска до стандартного вида.
     * @private
     */
    _clearSearchHighlights() {
        if (this.foundNodeIds.length === 0) return;

        const updates = this.foundNodeIds.map(nodeId => {
            const node = this.nodesDataSet.get(nodeId);
            if (!node) return null;
            const group = node.group || 'nickname';
            const config = NODE_TYPES[group] || NODE_TYPES.nickname;
            const groupConfig = NETWORK_CONFIG.groups[group];
            return {
                id: nodeId,
                borderWidth: config.borderWidth || 2,
                borderWidthSelected: 3,
                color: groupConfig?.color || {
                    background: config.color,
                    border: config.borderColor,
                    highlight: { background: config.highlightColor, border: config.borderColor }
                },
                size: groupConfig?.size || config.size || 20,
                font: {
                    ...node.font,
                    size: node.type === 'nickname' ? 12 : 11,
                    color: '#8888a0',
                    strokeWidth: 3
                }
            };
        }).filter(Boolean);

        this.nodesDataSet.update(updates);
        this.foundNodeIds = [];
        this.el.nodeCountBadge.textContent = this.nodesDataSet.length;
        this.el.nodeCountBadge.style.borderColor = '';
        this.el.nodeCountBadge.style.color = '';
    }

    /**
     * Очищает поисковый запрос.
     * @private
     */
    _onSearchClear() {
        this.el.searchInput.value = '';
        this.state.searchQuery = '';
        this.el.searchClear.classList.add('hidden');
        this._clearSearchHighlights();
        this.el.searchInput.focus();
    }

    /**
     * Центрирует граф с анимацией.
     * @private
     */
    _onCenterGraph() {
        if (!this.network) return;

        this.network.fit({
            animation: {
                duration: 800,
                easingFunction: 'easeInOutQuad'
            }
        });

        // Снимаем выделение
        this.network.unselectAll();
    }

    /**
     * Включает/выключает физику графа.
     * @private
     */
    _onTogglePhysics() {
        if (!this.network) return;

        this.state.physicsEnabled = !this.state.physicsEnabled;
        this.network.setOptions({
            physics: {
                enabled: this.state.physicsEnabled
            }
        });

        // Переключаем иконки
        this.el.physicsIconPause.classList.toggle('hidden', !this.state.physicsEnabled);
        this.el.physicsIconPlay.classList.toggle('hidden', this.state.physicsEnabled);
    }

    /**
     * Экспортирует граф в PNG с помощью html2canvas.
     * @private
     */
    async _onExportPng() {
        if (!this.network) return;

        try {
            // Показываем индикатор
            this.el.btnExportPng.disabled = true;
            this.el.btnExportPng.innerHTML = '⏳';

            // Останавливаем физику для чистого снимка
            const physicsWasEnabled = this.state.physicsEnabled;
            if (physicsWasEnabled) {
                this.network.setOptions({ physics: { enabled: false } });
            }

            // Делаем скриншот
            const canvas = await html2canvas(this.el.graphContainer, {
                backgroundColor: '#0a0a0c',
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: this.el.graphContainer.clientWidth,
                height: this.el.graphContainer.clientHeight
            });

            // Создаём ссылку для скачивания
            const link = document.createElement('a');
            link.download = `osint-graph-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Восстанавливаем физику
            if (physicsWasEnabled) {
                this.network.setOptions({ physics: { enabled: true } });
            }

            // Восстанавливаем кнопку
            this.el.btnExportPng.disabled = false;
            this.el.btnExportPng.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-label">PNG</span>
            `;

        } catch (error) {
            console.error('[OSINT Graph] Ошибка экспорта PNG:', error);
            this.el.btnExportPng.disabled = false;
            this.el.btnExportPng.innerHTML = '❌';
            setTimeout(() => {
                this.el.btnExportPng.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span class="btn-label">PNG</span>
                `;
            }, 2000);
        }
    }

    /**
     * Обрабатывает ресайз окна.
     * Обновляет мобильный флаг и переключает UI.
     * @private
     */
    _onResize() {
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth <= 900;

        // Если переключились с десктопа на мобилу с открытой панелью
        if (wasMobile !== this.state.isMobile) {
            this._handleResponsive();
        }
    }

    /**
     * Адаптирует UI под текущий размер экрана.
     * @private
     */
    _handleResponsive() {
        if (this.state.isMobile) {
            // Скрываем десктопную панель, показываем FAB
            this.el.detailPanel.classList.remove('open');
            this.el.detailPanel.style.display = 'none';
            if (this.el.mobileFab) {
                this.el.mobileFab.classList.remove('hidden');
            }
        } else {
            // Показываем десктопную панель, скрываем FAB
            this.el.detailPanel.style.display = 'flex';
            if (this.el.mobileFab) {
                this.el.mobileFab.classList.add('hidden');
            }
            // Закрываем bottom sheet если был открыт
            this.el.bottomSheet.classList.remove('open');
            this.el.overlay.classList.add('hidden');
            this.el.overlay.classList.remove('visible');
        }
    }

    /**
     * Обрабатывает клик по оверлею (закрывает bottom sheet).
     * @private
     */
    _onOverlayClick() {
        this.hideDetailPanel();
    }

    /**
     * Drag-обработчик для bottom sheet (базовая реализация).
     * @param {Event} e - Событие мыши или тача
     * @private
     */
    _onBottomSheetDrag(e) {
        // Заглушка — в production здесь полноценный swipe-to-dismiss
        // Для минимальной версии просто закрываем по оверлею
    }

    /**
     * Скрывает спиннер загрузки.
     * @param {number} delay - Задержка перед скрытием (мс)
     * @private
     */
    _hideSpinner(delay = 500) {
        setTimeout(() => {
            this.el.spinner.classList.add('hidden');
            this.el.spinner.setAttribute('aria-hidden', 'true');
        }, delay);
    }

    /**
     * Переводит тип узла на русский язык.
     * @param {string} type - Тип узла (nickname, email, ...)
     * @returns {string} Русскоязычное название типа
     * @private
     */
    _translateNodeType(type) {
        const translations = {
            'nickname': 'Никнейм',
            'email': 'Email',
            'phone': 'Телефон',
            'ip': 'IP-адрес',
            'geolocation': 'Геолокация',
            'telegram': 'Telegram',
            'domain': 'Домен'
        };
        return translations[type] || type || 'Неизвестный тип';
    }

    /**
     * Экранирует HTML-спецсимволы для безопасной вставки.
     * @param {string} text - Исходный текст
     * @returns {string} Экранированный текст
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ============================================================
   РАЗДЕЛ 4: ТОЧКА ВХОДА
   ============================================================ */

/**
 * Точка входа в приложение.
 * Создаёт экземпляр App и инициализирует его после загрузки DOM.
 *
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Создаём глобальный экземпляр приложения
    const app = new OsintGraphApp();

    // Сохраняем в window для отладки через консоль
    window.__osintApp = app;

    // Запускаем инициализацию с небольшой задержкой для плавности
    requestAnimationFrame(() => {
        app.init();
    });
});

/**
 * Сообщение в консоль при загрузке.
 */
console.log('%c OSINT Graph Visualizer PRO v3.0 ',
    'background: #00ff66; color: #0a0a0c; font-size: 14px; font-weight: bold; padding: 8px 16px; border-radius: 4px; font-family: monospace;');
console.log('%c Авторизованный пентест. Все данные — демонстрационные. ',
    'background: #1a1a22; color: #8888a0; font-size: 11px; padding: 4px 12px; border-radius: 4px;');

// Конец app.js