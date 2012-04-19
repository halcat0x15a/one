from pygments.lexers import get_all_lexers

result = ','.join(map(lambda lexer: lexer[1][0], get_all_lexers()))
