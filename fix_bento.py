with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "r") as f:
    content = f.read()

# I will find the block:
#         })}
#       </div>
# and replace it with:
#         })}
#       </div>
#       </div>

content = content.replace(
    '        })}\n      </div>',
    '        })}\n      </div>\n      </div>'
)

# And remove the extra </div> at the very end of the file.
content = content.replace(
    '    </div>\n    </div>\n  );\n}',
    '    </div>\n  );\n}'
)

with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "w") as f:
    f.write(content)
