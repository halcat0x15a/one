from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

lexer = get_lexer_by_name("python")
formatter = HtmlFormatter()
highlight("print 'Hello'", lexer, formatter)
