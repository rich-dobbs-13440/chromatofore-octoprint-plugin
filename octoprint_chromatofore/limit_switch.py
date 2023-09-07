class LimitSwitch:
    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.role = data.get("role")

class LimitSwitch:
    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.role = data.get("role")

    def __str__(self):
        return f"LimitSwitch(Role: {self.role}, Board: 0x{self.board:02X}, Channel: {self.channel})"

    def __repr__(self):
        return f"LimitSwitch(data={{'board': 0x{self.board:02X}, 'channel': {self.channel}, 'role': {repr(self.role)}}})"
    
    def unique_hash(self):
        essential_data = (self.board, self.channel)
        return f"{hash(essential_data):08x}"
