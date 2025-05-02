// markdownUtils.js - 用于处理Markdown渲染和引用的工具函数
const markdownUtils = {
  /**
   * 渲染Markdown内容，处理<think>标签和引用标记
   * @param {string} content - 原始Markdown内容
   * @param {Object} message - 当前消息对象，包含chunks等引用信息
   * @returns {string} 渲染后的HTML内容
   */
  renderMarkdown(content, message) {
    if (!content) return '';

    try {
      // 查找<think>标签内容并替换为可折叠组件
      const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
      let processedText = content;
      let match;
      let lastIndex = 0;
      let result = '';

      // 处理<think>标签内容
      while ((match = thinkRegex.exec(content)) !== null) {
        // 添加匹配项之前的文本
        result += content.substring(lastIndex, match.index);

        // 提取<think>标签内的内容
        const thinkContent = match[1].trim();

        // 生成可折叠组件HTML
        result += `<div class="collapsible-wrapper active">
          <div class="collapsible-header">
              <i class="fas fa-lightbulb"></i>
              <span>思考过程</span>
              <i class="fas fa-chevron-down toggle-icon"></i>
          </div>
          <div class="collapsible-content">
              ${thinkContent}
          </div>
        </div>`;

        lastIndex = match.index + match[0].length;
      }

      // 添加剩余的文本
      result += content.substring(lastIndex);
      processedText = result;

      // 使用一个通用的正则表达式匹配所有 ##数字$$ 格式
      const referenceRegex = /##(\d+)\$\$/g;
      match = null;
      lastIndex = 0;
      result = '';

      // 获取当前消息的chunks数据
      let chunks = [];
      if (message) {
        if (typeof message === 'string') {
          try {
            const parsedMessage = JSON.parse(message);
            chunks = parsedMessage.chunks || [];
          } catch (e) {
            console.error('解析消息数据失败:', e);
          }
        } else if (message.chunks && Array.isArray(message.chunks)) {
          chunks = message.chunks;
        } else if (message.reference) {
          if (typeof message.reference === 'string') {
            try {
              const parsedReference = JSON.parse(message.reference);
              chunks = parsedReference.chunks || [];
            } catch (e) {
              console.error('解析引用数据失败:', e);
            }
          } else if (Array.isArray(message.reference)) {
            chunks = message.reference;
          } else if (message.reference.chunks) {
            chunks = message.reference.chunks;
          }
        }
      }

      // 逐个处理每个匹配项
      while ((match = referenceRegex.exec(processedText)) !== null) {
        // 添加匹配项之前的文本
        result += processedText.substring(lastIndex, match.index);

        const chunkIndex = parseInt(match[1]);
        if (chunks && Array.isArray(chunks) &&
          chunkIndex >= 0 && chunkIndex < chunks.length &&
          chunks[chunkIndex]) {
          const chunkContent = chunks[chunkIndex].content;
          result += `<span class="reference-icon" data-chunk-index="${chunkIndex}"><i class="fas fa-book"></i></span>`;
        } else {
          // 如果找不到对应的chunk，添加一个不可点击的图标
          result += `<span class="reference-icon" title="引用内容不可用"><i class="fas fa-book"></i></span>`;
          console.log('未找到引用:', chunkIndex);
        }
        lastIndex = match.index + match[0].length;
      }

      // 添加剩余的文本
      result += processedText.substring(lastIndex);
      processedText = result;

      // 配置 marked 选项
      marked.setOptions({
        gfm: true,    // 启用 GitHub 风格的 Markdown
        headerIds: false, // 禁用标题 ID 生成
        sanitize: false,  // 不进行 HTML 转义（注意：这可能有安全风险）
        mangle: false,    // 不转义邮件地址
      });

      return marked.parse(processedText);
    } catch (error) {
      console.error('Markdown 渲染错误:', error);
      return content; // 如果渲染失败，返回原始文本
    }
  },

  /**
   * 处理引用点击事件，显示引用内容浮层
   * @param {Event} event - 点击事件
   * @param {Object} message - 当前消息对象，包含chunks等引用信息
   * @param {Object} options - 配置选项，包含isMobile、showReferenceTooltip、referenceTooltipStyle、isReferenceLoading等
   * @returns {Object} 引用内容和状态
   */
  handleReferenceHover(event, message, options) {
    console.log('handleReferenceHover 被调用', message);
    const result = {
      showTooltip: false,
      tooltipStyle: {},
      isLoading: false,
      referenceContent: '',
    };

    if (!event.target.closest('.reference-icon')) {
      return result;
    }

    const iconElement = event.target.closest('.reference-icon');
    const chunkIndex = iconElement.getAttribute('data-chunk-index');
    console.log('引用索引:', chunkIndex);
    if (!chunkIndex) return result;

    // 计算浮层位置
    const rect = iconElement.getBoundingClientRect();
    let tooltipTop = rect.bottom + 5; // 图标下方5px
    let tooltipLeft = rect.left;

    // 获取浮层宽度和视窗宽度
    const isMobile = options && options.isMobile !== undefined ? options.isMobile : (window.innerWidth < 768);
    const tooltipWidth = isMobile ? window.innerWidth * 0.9 : 400; // 移动端使用90%宽度
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 防止浮层超出右侧边界
    if (tooltipLeft + tooltipWidth > viewportWidth) {
      tooltipLeft = Math.max(10, viewportWidth - tooltipWidth - 10);
    }

    // 检查是否超出底部边界，如果是则在图标上方显示
    const tooltipHeight = 300; // 浮层最大高度
    if (tooltipTop + tooltipHeight > viewportHeight) {
      tooltipTop = rect.top - tooltipHeight - 5;
    }

    // 确保不超出顶部边界
    if (tooltipTop < 0) {
      tooltipTop = 10;
    }

    result.tooltipStyle = {
      position: 'fixed',
      top: `${tooltipTop}px`,
      left: `${tooltipLeft}px`,
      width: isMobile ? '90%' : '400px', // 移动端响应式宽度
      zIndex: 10000
    };

    // 显示状态
    result.isLoading = true;
    result.showTooltip = true;

    // 获取chunks数据
    let chunks = [];
    if (message) {
      if (typeof message === 'string') {
        try {
          const parsedMessage = JSON.parse(message);
          chunks = parsedMessage.chunks || [];
        } catch (e) {
          console.error('解析消息数据失败:', e);
        }
      } else if (message.chunks && Array.isArray(message.chunks)) {
        chunks = message.chunks;
      } else if (message.reference) {
        if (typeof message.reference === 'string') {
          try {
            const parsedReference = JSON.parse(message.reference);
            chunks = parsedReference.chunks || [];
          } catch (e) {
            console.error('解析引用数据失败:', e);
          }
        } else if (Array.isArray(message.reference)) {
          chunks = message.reference;
        } else if (message.reference.chunks) {
          chunks = message.reference.chunks;
        }
      }
    }

    // 获取引用内容
    if (chunks && Array.isArray(chunks) &&
      chunkIndex >= 0 && chunkIndex < chunks.length &&
      chunks[chunkIndex]) {
      // 使用 marked 渲染引用内容中的 Markdown
      const chunk = chunks[chunkIndex];
      const rawContent = chunk.content || '';

      // 添加文档信息
      let contentWithDocInfo = rawContent;

      // 添加分隔线和文档信息
      // contentWithDocInfo += '\n\n---\n\n';

      // 文档名称和链接处理
      const documentName = chunk.document_name || chunk.doc_name || '未知文档';
      const documentId = chunk.document_id || chunk.doc_id;

      // 安全地提取文档内容名称
      let documentContentName = '相关内容';
      const contentMatch = rawContent.match(/#\s*(.*)/);
      if (contentMatch && contentMatch[1]) {
        documentContentName = contentMatch[1];
      }

      // if (documentId) {
      //   contentWithDocInfo += `**参考资料：** <a href="https://www.mingding.org/?s=${documentContentName}" target="_blank">${documentName}</a>`;
      // } else {
      //   contentWithDocInfo += `**参考资料：** ${documentName}`;
      // }
      result.chunk = chunk
      result.referenceContent = marked.parse(contentWithDocInfo);
      result.isLoading = false;
    } else {
      result.referenceContent = '<p>无法加载引用内容</p>';
      result.isLoading = false;
    }

    return result;
  }
};

// 如果在浏览器环境中，将工具函数挂载到window对象上
if (typeof window !== 'undefined') {
  window.markdownUtils = markdownUtils;
} 