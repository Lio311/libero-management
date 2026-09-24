with open("src/app/tasks/tasks-client.tsx", "r") as f:
    content = f.read()

# I will find the end of the file and replace it.
import re
content = re.sub(r'          </table>\n        </div>\n        \)\}\n    </div>\n  \);\n}', '          </table>\n        </div>\n    </div>\n  );\n}', content)
content = re.sub(r'          </table>\n        \)\}\n    </div>\n  \);\n    </div>\n  \);\n}', '          </table>\n        </div>\n    </div>\n  );\n}', content)
content = re.sub(r'          </table>\n        \)\}\n    </div>\n  \);\n}', '          </table>\n        </div>\n    </div>\n  );\n}', content)
content = re.sub(r'          </table>\n        </div>\n        \)\}\n    </div>\n  \);\n}', '          </table>\n        </div>\n    </div>\n  );\n}', content)
with open("src/app/tasks/tasks-client.tsx", "w") as f:
    f.write(content)

