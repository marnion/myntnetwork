var menu_system = ` 
    <li class="nav-item"><a href="index.html" class="notranslate">Home</a><span style="border-right: 1px solid #FFFFFF;">&nbsp;&nbsp;</span>&nbsp;&nbsp;<a href="https://t.me/bankrollnetwork">Telegram</a></li>
    <li class="nav-item"></li>
    <li class="nav-item"><a href="refinery.html" class="notranslate">Refinery</a></li>
    <li class="nav-item"><a href="treasury.html" class="notranslate">Treasury</a></li>
    <li class="nav-item"><a href="forge.html" class="notranslate">Forge</a></li>

    <li class="nav-item"><a href="resources.html">HELP</a></li>

`

var mobile_menu_html = `
<li class="nav-item">&nbsp;</li>
<li class="nav-item">
                <div class="dropdown d-inline-block">
                    <a class="dropdown-toggle mb-1 notranslate" id="dropdownMenuButtonMob"
                       data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="glyph-icon simple-icon-globe"></span>
                    </a>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonMob">
                        <a onclick="setLanguageCookie('en');" href="javascript:void(0);" class="dropdown-item lang-en lang-select notranslate" data-lang="en">English</a>
                        <a onclick="setLanguageCookie('zh-CN');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="zh-CN">中文</a>
                        <a onclick="setLanguageCookie('ja');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ja">日本人</a>
                        <a onclick="setLanguageCookie('ko');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ko">한국어</a>
                        <a onclick="setLanguageCookie('es');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="es">Español</a>
                        <a onclick="setLanguageCookie('ru');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ru">Русский</a>
                        <a onclick="setLanguageCookie('fr');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="fr">Français</a>
                    </div>
                </div>
            </li>
            ${menu_system}
            
`

var desktop_menu_html = `
<li class="nav-item">
                        <div class="dropdown d-inline-block">
                            <a class="dropdown-toggle mb-1 notranslate" id="dropdownMenuButton"
                               data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="glyph-icon simple-icon-globe"></span>
                            </a>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a onclick="setLanguageCookie('en');" href="javascript:void(0);" class="dropdown-item lang-en lang-select notranslate" data-lang="en">English</a>
                                <a onclick="setLanguageCookie('zh-CN');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="zh-CN">中文</a>
                                <a onclick="setLanguageCookie('ja');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ja">日本人</a>
                                <a onclick="setLanguageCookie('ko');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ko">한국어</a>
                                <a onclick="setLanguageCookie('es');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="es">Español</a>
                                <a onclick="setLanguageCookie('ru');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="ru">Русский</a>
                                <a onclick="setLanguageCookie('fr');" href="javascript:void(0);" class="dropdown-item lang-es lang-select notranslate" data-lang="fr">Français</a>
                            </div>
                        </div>
                    </li>
                    ${menu_system}
`