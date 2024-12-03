import { ExtensionContext, WebviewPanel } from "vscode";
import createWebView from "./utils/createWebView";
import { ServeUrl } from "./config/configures";

let panel: WebviewPanel | undefined = undefined;
export default async function welcomePage(
    context: ExtensionContext
): Promise<void> {
    const imgUrl = ServeUrl + "/web/img";
    const content = `
    <div style="padding:30px;min-width:500px;color:#fff;font-size: 14px;">
		<style>
		    a {color: #02A7F0;text-decoration: none;}
			hr {border: 0.1px solid #888;}
			h1{font-size: 32px;}
			h2{font-size: 20px;}
			h3{font-size: 16px;}
		</style>
		<h1>您的AI辅助编程助手</h1>
		<p>GPTCoder是法本信息技术股份有限公司FarAI系列的一款辅助编程产品，它利用业界领先的AI大模型技术进行开发，为开发人员提供智能化的代码辅助功能。GPTCoder支持多种编程语言和主流的集成开发环境，可以大大提高编程的效率和代码的质量，同时有助于提高团队的研发效率。</p>
		<hr/>
		<h2>环境支持</h2>
		<p>支持VSCode 1.68.1及以上版本的。<p>
		<hr/>
		<h2>快捷菜单</h2>
		<p style="text-indent: 20px;"><a href="#section0"><b>使用向导</b></a><p>
		<p style="text-indent: 40px;"><a href="#section1"><b>账号登录</b></a><p>
		<p style="text-indent: 40px;"><a href="#section2"><b>快捷键和设置</b></a><p>
		<p style="text-indent: 40px;"><a href="#section3"><b>代码补齐</b></a><p>
		<p style="text-indent: 40px;"><a href="#section4"><b>注释生成代码</b></a><p>
		<p style="text-indent: 40px;"><a href="#section5"><b>生成行级注释</b></a><p>
		<p style="text-indent: 40px;"><a href="#section6"><b>代码纠正</b></a><p>
		<p style="text-indent: 40px;"><a href="#section7"><b>代码解释</b></a><p>
		<p style="text-indent: 40px;"><a href="#section8"><b>代码转换</b></a><p>
		<p style="text-indent: 40px;"><a href="#section9"><b>生成单元测试</b></a><p>
		<p style="text-indent: 40px;"><a href="#section10"><b>技术问答</b></a><p>
		<p style="text-indent: 20px;"><a href="#section11"><b>核心优势</b></a><p>
		<hr/>
		<section id="section0"><h2>使用向导</h2></section>
		<section id="section1">
			<h3>账号登录</h3>
			<p>1、点击【登录】按钮：</p>
			<img src="{imgUrl}/v1.png"/>
			<p>2、在GPTCoder开放平台登录账号：</p>
			<img src="{imgUrl}/v2.png"/>
			<p>3、登录成功后返回VSCoder编辑器中就可以享受GPTCoder带来的智能辅助编程体验。</p>
		</section>
		<section id="section2">
			<h3>快捷键和设置</h3>
			<p><b>禁用</b>沉浸式代码生成模式:</p>
			<p>GPTCoder插件默认开启沉浸式代码生成体验，即：自动补齐和提示代码，若需要关闭此功能可以在设置界面中将如下设置项进行勾选。</p>
			<img src="{imgUrl}/v3.png"/>
			<h3>快捷键:</h3>
			<h4>方式一:</h4>
			<p>• Tab：采纳代码</p>
			<p>• Esc：不采纳建议代码</p>
			<p>• Alt+\：主动获取代码提示</p>
			<p>• Alt+T：生成行级注释</p>
			<p>• Ctrl+Alt+E：代码解释</p>
			<p>• Ctrl+Alt+C：代码纠正</p>
			<p>• Ctrl+Alt+Q：代码转换</p>
			<h4>方式二:</h4>
			<p>可以在代码编辑区域选中一段代码或者在主页i的问题框中录入一段代码，点击主页的快捷键可以快速对代码进行纠错、解释、转换和生成单元测试。</p>
			<img src="{imgUrl}/v4.png"/>
			<h3>更多设置:</h3>
			<p>打开设置页面可以对插件进行更多设置。</p>
			<img src="{imgUrl}/v5.png"/>
		</section>
		<section id="section3">
			<h3>代码补齐</h3>
			<p>在已有上下文的代码中，回车、空格均会自动触发GPTCoder得代码补全功能，生成的建议代码如灰色部分所示，点击Tab键采纳建议，Esc键则可以忽略建议：</p>
			<img src="{imgUrl}/v6.png"/>
		</section>
		<section id="section4">
			<h3>注释/函数名生成代码</h3>
			<p>GPTCoder根据注释、函数名生成函数级代码块，在写完函数头注释或者函数名后，回车触发代码生成请求，点击Tab键采纳建议，Esc键则可以忽略建议：</p>
			<img src="{imgUrl}/v7.png"/>
		</section>
		<section id="section5">
			<h3>生成行级注释</h3>
			<p>选中要注释的代码，点击鼠标右键-选择【GPTCoder-代码注释】(或者使用快捷键Alt+T)，生成代码的行级注释。</p>
			<p>生成注释前：</p>
			<img src="{imgUrl}/v8.png"/>
			<p>生成注释后：</p>
			<img src="{imgUrl}/v9.png"/>
		</section>
		<section id="section6">
			<h3>代码纠正</h3>
			<p>选中需要纠错的代码，点击鼠标右键-选择【GPTCoder-代码纠正】 (或者使用<a>快捷方式</a>)，将在GPTCoder主页面中对选中代码进行纠错，并列出修正后的代码。</p>
			<img src="{imgUrl}/v10.png"/>
		</section>
		<section id="section7">
			<h3>代码解释</h3>
			<p>选中需要GPTCoder帮助您理解的代码，点击鼠标右键-选择【GPTCoder-代码解释】 (或者使用<a>快捷方式</a>)，将在GPTCoder主页面中对选中代码进行详细解释。</p>
			<img src="{imgUrl}/v11.png"/>
		</section>
		<section id="section8">
			<h3>代码转换</h3>
			<p>选中需要转换的代码（也可以不选择活录入代码），点击主页面的【代码转换】快捷键，将跳转到代码转换页面。</p>
			<img src="{imgUrl}/v12.png"/>
		</section>
		<section id="section9">
			<h3>生成单元测试</h3>
			<p>选中需要进行单元测试的代码（尽量保证发送完整完整，效果会更好），点击鼠标右键-选择【GPTCoder-单元测试】 (或者使用<a>快捷方式</a>)，将在GPTCoder主页面中生成这段代码的单元测试代码。</p>
			<img src="{imgUrl}/v13.png"/>
		</section>
		<section id="section10">
			<h3>技术问答</h3>
			<p>打开活动栏的GPTCoder功能栏，可以选择或者录入一段代码进行提问，也可以问其他技术相关问题，GPTCoder将提供非常专业细致的代码建议。</p>
			<img src="{imgUrl}/v14.png"/>
		</section>
		<section id="section11">
			<h2>核心优势</h2>
			<h3>1.更安全自主</h3>
			<p>• 私有化部署，保护数据隐私及信息安全</p>
			<p>• 支持国产GPU与工具链 插件和模型自主切换</p>
			<p>• 自主管控 模型版权自主</p>
			
			<h3>2.更便捷高效</h3>
			<p>• 统一交互，与IDE无缝集成</p>
			<p>• 内网运行效率与体验更好</p>
			<p>• 服务快速部署</p>
			
			<h3>3.更强大</h3>
			<p>• 全球一流模型池</p>
			<p>• 二次训练调优、使用-训练-部署闭环</p>
			<p>• 通用、代码、审核等多模型融合协同训练</p>
			<p>• 支持后台运营数据管理与定制</p>
			
			<h3>4.更灵活</h3>
			<p>• 支持公网、私网部署，联机、脱机</p>
			<p>• 支持多种国产国际GPU</p>
			<p>• 选型与架构适应国内外不同政策</p>
			<p>• 支持全链条个性化定制</p>
		</section>
	</div>`;
    await createWebView(context, content.replace(/\{imgUrl\}/g, imgUrl));
}
